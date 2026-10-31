import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  audioOnly,
  mixAudio,
  openMicrophone,
  shareThisTab,
  stopTracks,
} from '../../../src/content/recorder/media';
import { createSegmentRecorder } from '../../../src/content/recorder/segments';
import { createVideoRecorder } from '../../../src/content/recorder/video';
import {
  FakeAudioContext,
  FakeRecorder,
  FakeStream,
  installMedia,
  micStream,
  tabStream,
} from './media-fakes';

let devices: ReturnType<typeof installMedia>;

beforeEach(() => {
  devices = installMedia();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const asStream = (fake: FakeStream): MediaStream => fake as unknown as MediaStream;

describe('media', () => {
  it('asks Chrome to share this tab with its audio at 720p/15 fps', async () => {
    const tab = tabStream();
    devices.getDisplayMedia.mockResolvedValue(tab);
    await expect(shareThisTab()).resolves.toBe(tab);
    expect(devices.getDisplayMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        audio: true,
        preferCurrentTab: true,
        video: expect.objectContaining({ frameRate: { ideal: 15, max: 15 } }),
      }),
    );
  });

  it('explains a cancelled share and keeps the cause', async () => {
    const refusal = new DOMException('Permission denied', 'NotAllowedError');
    devices.getDisplayMedia.mockRejectedValue(refusal);
    const error: unknown = await shareThisTab().catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe(
      'Sharing this tab was cancelled, so transcription did not start',
    );
    expect((error as Error).cause).toBe(refusal);
  });

  it('refuses a share without the tab audio and releases it', async () => {
    const tab = tabStream({ audio: false });
    devices.getDisplayMedia.mockResolvedValue(tab);
    await expect(shareThisTab()).rejects.toThrow(/Also share tab audio/);
    expect(tab.tracks[0].stop).toHaveBeenCalledTimes(1);
  });

  it('opens the microphone with echo cancellation, or answers null when it is unavailable', async () => {
    const mic = micStream();
    devices.getUserMedia.mockResolvedValueOnce(mic);
    await expect(openMicrophone()).resolves.toBe(mic);
    expect(devices.getUserMedia).toHaveBeenCalledWith({ audio: { echoCancellation: true } });
    devices.getUserMedia.mockRejectedValueOnce(new Error('NotAllowedError'));
    await expect(openMicrophone()).resolves.toBeNull();
  });

  it('mixes the call and the microphone into one track', () => {
    const tab = tabStream();
    const mic = micStream();
    const context = new FakeAudioContext();
    const mixed = mixAudio(context as unknown as AudioContext, asStream(tab), asStream(mic));
    expect(mixed).toBe(context.destination.stream.tracks[0]);
    expect(context.sources.map((source) => source.stream)).toEqual([tab, mic]);
    for (const source of context.sources) {
      expect(source.connect).toHaveBeenCalledWith(context.destination);
    }
    const alone = new FakeAudioContext();
    mixAudio(alone as unknown as AudioContext, asStream(tab), null);
    expect(alone.sources).toHaveLength(1);
  });

  it('keeps only the audio tracks, and stops every track of a stream', () => {
    const tab = tabStream();
    expect((audioOnly(asStream(tab)) as unknown as FakeStream).tracks).toEqual(
      tab.getAudioTracks(),
    );
    stopTracks(asStream(tab));
    stopTracks(null);
    expect(tab.tracks.every((track) => track.readyState === 'ended')).toBe(true);
  });
});

describe('segment recorder', () => {
  const start = (chunkMs = 15_000) => {
    const onSegment = vi.fn();
    const onError = vi.fn();
    const segments = createSegmentRecorder(asStream(micStream()), chunkMs, onSegment, onError);
    return { segments, onSegment, onError };
  };

  it('records back-to-back self-contained Opus files every chunk', async () => {
    vi.useFakeTimers({ now: 1_000_000 });
    const { onSegment } = start();
    expect(FakeRecorder.instances[0].options).toEqual({
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 32_000,
    });
    await vi.advanceTimersByTimeAsync(15_000);
    expect(FakeRecorder.instances.map((recorder) => recorder.state)).toEqual([
      'inactive',
      'recording',
    ]);
    await vi.advanceTimersByTimeAsync(15_000);
    expect(FakeRecorder.instances).toHaveLength(3);
    expect(
      onSegment.mock.calls.map(([segment]) => [segment.startedAt, segment.durationMs]),
    ).toEqual([
      [1_000_000, 15_000],
      [1_015_000, 15_000],
    ]);
    const blob = onSegment.mock.calls[0][0].blob as Blob;
    expect(blob.type).toBe('audio/webm;codecs=opus');
    await expect(blob.text()).resolves.toBe('webm');
  });

  it('drops a segment shorter than half a second', async () => {
    vi.useFakeTimers();
    const { segments, onSegment } = start();
    vi.advanceTimersByTime(499);
    await segments.stop();
    expect(onSegment).not.toHaveBeenCalled();
  });

  it('closes the chunk on pause, opens a new one on resume, and flushes on stop', async () => {
    vi.useFakeTimers();
    const { segments, onSegment } = start();
    vi.advanceTimersByTime(4000);
    await segments.pause();
    expect(onSegment).toHaveBeenCalledTimes(1);
    await segments.pause();
    vi.advanceTimersByTime(60_000);
    expect(FakeRecorder.instances).toHaveLength(1);
    segments.resume();
    segments.resume();
    expect(FakeRecorder.instances).toHaveLength(2);
    vi.advanceTimersByTime(2000);
    await segments.stop();
    expect(onSegment).toHaveBeenLastCalledWith(expect.objectContaining({ durationMs: 2000 }));
  });

  it('does not stop a recorder Chrome already stopped', async () => {
    const { segments } = start();
    const recorder = FakeRecorder.instances[0];
    recorder.state = 'inactive';
    const stop = vi.spyOn(recorder, 'stop');
    await segments.stop();
    expect(stop).not.toHaveBeenCalled();
  });

  it('reports a chunk that could not be opened', async () => {
    vi.useFakeTimers();
    const { onError } = start(1000);
    FakeRecorder.failNext = true;
    await vi.advanceTimersByTimeAsync(1000);
    expect(onError).toHaveBeenCalledWith(new Error('NotSupportedError'));
  });
});

describe('video recorder', () => {
  const start = () => {
    vi.useFakeTimers({ now: 5_000_000 });
    const onPiece = vi.fn();
    const video = createVideoRecorder(asStream(tabStream()), 5000, onPiece);
    return { video, onPiece, recorder: FakeRecorder.instances[0] };
  };

  it('records one continuous H.264/Opus file handed over in numbered pieces', () => {
    const { onPiece, recorder } = start();
    expect(recorder.options).toEqual({
      mimeType: 'video/webm;codecs=h264,opus',
      videoBitsPerSecond: 1_000_000,
      audioBitsPerSecond: 64_000,
    });
    expect(recorder.timeslice).toBe(5000);
    vi.advanceTimersByTime(5000);
    recorder.emitData();
    recorder.emitData('');
    vi.advanceTimersByTime(4000);
    recorder.emitData();
    expect(onPiece.mock.calls.map(([piece]) => [piece.seq, piece.durationMs])).toEqual([
      [0, 5000],
      [1, 4000],
    ]);
  });

  it('flushes on pause, restarts the clock on resume, and ignores repeats', () => {
    const { video, onPiece, recorder } = start();
    vi.advanceTimersByTime(2000);
    video.pause();
    video.pause();
    expect(recorder.state).toBe('paused');
    expect(onPiece).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(60_000);
    video.resume();
    video.resume();
    expect(recorder.state).toBe('recording');
    vi.advanceTimersByTime(3000);
    recorder.emitData();
    expect(onPiece).toHaveBeenLastCalledWith(expect.objectContaining({ seq: 1, durationMs: 3000 }));
  });

  it('hands over the last piece on stop, and stops only once', async () => {
    const { video, onPiece, recorder } = start();
    await video.stop();
    expect(recorder.state).toBe('inactive');
    expect(onPiece).toHaveBeenCalledWith(expect.objectContaining({ seq: 0, durationMs: 1 }));
    await video.stop();
    expect(onPiece).toHaveBeenCalledTimes(1);
  });
});
