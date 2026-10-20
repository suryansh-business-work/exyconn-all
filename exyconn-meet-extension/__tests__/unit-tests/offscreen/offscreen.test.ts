import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createChunkRecorder } from '../../../src/offscreen/recorder';
import { base64ToBytes } from '../../../src/utils/base64';
import { dispatchMessage, installChrome, type ChromeMock } from '../chrome-mock';
import { contexts, fakeStream, installAudio, worklets } from './audio-fakes';

beforeEach(() => {
  installChrome();
  installAudio();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

/** 16 samples = 1 ms at 16 kHz, so a 1 ms chunk fills with one emit. */
const CHUNK_MS = 1;

describe('chunk recorder', () => {
  it('captures through a muted 16 kHz worklet chain and emits WAV chunks', async () => {
    const onChunk = vi.fn(() => Promise.resolve());
    const onError = vi.fn();
    const source = fakeStream();
    const recorder = await createChunkRecorder(
      source as unknown as MediaStream,
      'TAB',
      CHUNK_MS,
      onChunk,
      onError,
    );
    const [context] = contexts;
    expect(context.sampleRate).toBe(16_000);
    expect(context.audioWorklet.addModule).toHaveBeenCalledWith(
      'chrome-extension://test-extension-id/pcm-worklet.js',
    );
    expect(context.gains[0].gain.value).toBe(0);
    expect(context.gains[0].connect).toHaveBeenCalledWith(context.destination);
    worklets[0].emit(8);
    expect(onChunk).not.toHaveBeenCalled();
    worklets[0].emit(8);
    await vi.waitFor(() => expect(onChunk).toHaveBeenCalledTimes(1));
    const [chunk] = onChunk.mock.calls[0] as unknown as [
      { stream: string; durationMs: number; audio: string },
    ];
    expect(chunk).toMatchObject({ stream: 'TAB', durationMs: 1 });
    expect(base64ToBytes(chunk.audio)).toHaveLength(44 + 32);
    await recorder.stop();
    expect(context.close).toHaveBeenCalledTimes(1);
    expect(worklets[0].port.onmessage).toBeNull();
    expect(onError).not.toHaveBeenCalled();
  });

  it('flushes on pause, records nothing while paused, and resumes', async () => {
    const onChunk = vi.fn(() => Promise.resolve());
    const recorder = await createChunkRecorder(
      fakeStream() as unknown as MediaStream,
      'MIC',
      1000,
      onChunk,
      vi.fn(),
    );
    worklets[0].emit(100);
    await recorder.pause();
    expect(onChunk).toHaveBeenCalledTimes(1);
    worklets[0].emit(100);
    await recorder.pause();
    expect(onChunk).toHaveBeenCalledTimes(1);
    recorder.resume();
    worklets[0].emit(50);
    await recorder.stop();
    expect(onChunk).toHaveBeenCalledTimes(2);
  });

  it('reports a failed hand-over and keeps sending the next chunk', async () => {
    const onChunk = vi
      .fn()
      .mockRejectedValueOnce(new Error('worker gone'))
      .mockResolvedValue(undefined);
    const onError = vi.fn();
    const recorder = await createChunkRecorder(
      fakeStream() as unknown as MediaStream,
      'TAB',
      CHUNK_MS,
      onChunk,
      onError,
    );
    worklets[0].emit(16);
    worklets[0].emit(16);
    await recorder.stop();
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(onChunk).toHaveBeenCalledTimes(2);
  });
});

describe('pcm worklet', () => {
  it('registers a processor that posts copies of the first channel', async () => {
    const registered: Array<
      [
        string,
        new () => {
          port: { postMessage: (data: Float32Array) => void };
          process: (inputs: Float32Array[][]) => boolean;
        },
      ]
    > = [];
    vi.stubGlobal(
      'AudioWorkletProcessor',
      class {
        port = { postMessage: vi.fn() };
      },
    );
    vi.stubGlobal('registerProcessor', (name: string, processor: never) =>
      registered.push([name, processor]),
    );
    await import('../../../src/offscreen/pcm-worklet');
    const [name, Processor] = registered[0];
    expect(name).toBe('exyconn-pcm-capture');
    const processor = new Processor();
    const input = Float32Array.from([0.1, 0.2]);
    expect(processor.process([[input]])).toBe(true);
    expect(processor.process([[]])).toBe(true);
    expect(processor.process([[new Float32Array(0)]])).toBe(true);
    expect(processor.port.postMessage).toHaveBeenCalledTimes(1);
    const posted = (processor.port.postMessage as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as Float32Array;
    expect(posted).toEqual(input);
    expect(posted).not.toBe(input);
  });
});

describe('offscreen document', () => {
  const start = (captureMic: boolean, key = 'k1') => ({
    target: 'offscreen',
    type: 'offscreen/start',
    sessionKey: key,
    tabId: 5,
    meetingId: 'm1',
    streamId: 'stream-1',
    meetingStartedAtMs: 0,
    captureMic,
    chunkMs: CHUNK_MS,
  });

  async function boot(getUserMedia: ReturnType<typeof vi.fn>): Promise<ChromeMock> {
    const chrome = installChrome();
    chrome.runtime.sendMessage.mockResolvedValue({ ok: true, data: null });
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
    await import('../../../src/offscreen/index');
    return chrome;
  }

  const sent = (chrome: ChromeMock) =>
    chrome.runtime.sendMessage.mock.calls.map(([m]) => m as Record<string, unknown>);

  it('plays the tab back, records tab and mic, and hands chunks to the worker in order', async () => {
    const tab = fakeStream();
    const mic = fakeStream();
    const getUserMedia = vi.fn().mockResolvedValueOnce(tab).mockResolvedValueOnce(mic);
    const chrome = await boot(getUserMedia);
    await expect(dispatchMessage(chrome, start(true))).resolves.toEqual({ ok: true, data: null });
    expect(getUserMedia.mock.calls[0][0]).toEqual({
      audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: 'stream-1' } },
      video: false,
    });
    const playback = contexts.find((context) => context.sampleRate !== 16_000);
    expect(playback?.sources[0].connect).toHaveBeenCalledWith(playback?.destination);
    expect(worklets).toHaveLength(2);
    worklets[0].emit(16);
    worklets[1].emit(16);
    await vi.waitFor(() =>
      expect(sent(chrome).filter((m) => m.type === 'offscreen/chunk')).toHaveLength(2),
    );
    expect(sent(chrome).find((m) => m.type === 'offscreen/chunk')).toMatchObject({
      sessionKey: 'k1',
      meetingId: 'm1',
      stream: 'TAB',
      durationMs: 1,
    });
    await dispatchMessage(chrome, {
      target: 'offscreen',
      type: 'offscreen/pause',
      sessionKey: 'k1',
    });
    await dispatchMessage(chrome, {
      target: 'offscreen',
      type: 'offscreen/resume',
      sessionKey: 'k1',
    });
    await dispatchMessage(chrome, {
      target: 'offscreen',
      type: 'offscreen/stop',
      sessionKey: 'k1',
    });
    expect(tab.track.stop).toHaveBeenCalledTimes(1);
    expect(mic.track.stop).toHaveBeenCalledTimes(1);
    expect(sent(chrome).at(-1)).toEqual({
      type: 'offscreen/notice',
      sessionKey: 'k1',
      reason: 'stopped',
    });
  });

  it('records the meeting only when the microphone is unavailable, and says so', async () => {
    const getUserMedia = vi
      .fn()
      .mockResolvedValueOnce(fakeStream())
      .mockRejectedValueOnce(new Error('denied'));
    const chrome = await boot(getUserMedia);
    await dispatchMessage(chrome, start(true));
    expect(worklets).toHaveLength(1);
    expect(sent(chrome)).toContainEqual({
      type: 'offscreen/notice',
      sessionKey: 'k1',
      reason: 'The microphone is not available, so only the meeting audio is transcribed',
    });
  });

  it('reports when the tab audio ends, and restarts cleanly for the same session', async () => {
    const first = fakeStream();
    const getUserMedia = vi.fn().mockResolvedValueOnce(first).mockResolvedValueOnce(fakeStream());
    const chrome = await boot(getUserMedia);
    await dispatchMessage(chrome, start(false));
    await dispatchMessage(chrome, start(false));
    expect(first.track.stop).toHaveBeenCalledTimes(1);
    expect(sent(chrome).filter((m) => m.type === 'offscreen/notice')).toHaveLength(0);
    first.end();
    await vi.waitFor(() =>
      expect(sent(chrome)).toContainEqual({
        type: 'offscreen/error',
        sessionKey: 'k1',
        reason: 'The meeting audio ended, so transcription stopped',
      }),
    );
  });

  it('answers a failed start with an error, and ignores commands for nothing or for others', async () => {
    const chrome = await boot(vi.fn().mockRejectedValueOnce(new Error('no tab')));
    await expect(dispatchMessage(chrome, start(false))).resolves.toEqual({
      ok: false,
      error: 'The recorder could not start. Check that the tab is still open.',
    });
    await expect(
      dispatchMessage(chrome, { target: 'offscreen', type: 'offscreen/pause', sessionKey: 'none' }),
    ).resolves.toEqual({ ok: true, data: null });
    await expect(
      dispatchMessage(chrome, {
        target: 'offscreen',
        type: 'offscreen/resume',
        sessionKey: 'none',
      }),
    ).resolves.toEqual({ ok: true, data: null });
    await expect(
      dispatchMessage(chrome, { target: 'offscreen', type: 'offscreen/stop', sessionKey: 'none' }),
    ).resolves.toEqual({ ok: true, data: null });
    await expect(dispatchMessage(chrome, { type: 'state/changed' })).resolves.toBeUndefined();
    await expect(dispatchMessage(chrome, null)).resolves.toBeUndefined();
  });
});
