import type { Logger } from '@exyconn/logger';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CapturePlan } from '../../../src/types/meeting';
import type { WorkerReply, WorkerRequest } from '../../../src/types/messages';
import { dispatchMessage, installChrome, type ChromeMock } from '../chrome-mock';
import { FakeAudioContext, FakeRecorder, installMedia, micStream, tabStream } from './media-fakes';

const MEETING_START = Date.parse('2026-10-20T10:00:00.000Z');
const SHARE_ENDED = 'Sharing this tab stopped, so transcription stopped';
const NO_MIC = 'The microphone is not available, so only the meeting audio is transcribed';

const plan = (overrides: Partial<CapturePlan> = {}): CapturePlan => ({
  meetingId: 'm1',
  meetingStartedAtMs: MEETING_START,
  captureMic: false,
  chunkMs: 15_000,
  pieceMs: 5000,
  saveVideo: false,
  videoPart: 2,
  ...overrides,
});

let chrome: ChromeMock;
let devices: ReturnType<typeof installMedia>;
let replies: Partial<Record<WorkerRequest['type'], WorkerReply<unknown>>>;
const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
const asLogger = logger as unknown as Logger;

/** What the page sent the worker, in order. */
const sent = (): WorkerRequest[] =>
  chrome.runtime.sendMessage.mock.calls.map(([message]) => message as WorkerRequest);
const sentTypes = (): string[] => sent().map((message) => message.type);

async function load() {
  vi.resetModules();
  return import('../../../src/content/recorder');
}

beforeEach(() => {
  vi.useFakeTimers({ now: MEETING_START + 60_000 });
  chrome = installChrome();
  devices = installMedia();
  replies = { 'recorder/prepare': { ok: true, data: plan() } };
  chrome.runtime.sendMessage.mockImplementation((message: unknown) =>
    Promise.resolve(replies[(message as WorkerRequest).type] ?? { ok: true, data: null }),
  );
  for (const fn of Object.values(logger)) {
    fn.mockClear();
  }
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('starting the recorder', () => {
  it('shares the tab, records consent, follows the plan and reports the start', async () => {
    const tab = tabStream();
    devices.getDisplayMedia.mockResolvedValue(tab);
    const { startRecording } = await load();
    await startRecording(true, asLogger);
    expect(sentTypes()).toEqual(['capture/consent', 'recorder/prepare', 'recorder/started']);
    expect(sent()[2]).toEqual({ type: 'recorder/started', micEnabled: false });
    expect(devices.getUserMedia).not.toHaveBeenCalled();
    // No recordings kept: the video track is released and only the call audio is recorded.
    expect(tab.getVideoTracks()[0].stop).toHaveBeenCalled();
    expect(FakeRecorder.instances).toHaveLength(1);
    expect(FakeRecorder.instances[0].stream.getTracks()).toEqual(tab.getAudioTracks());
    expect(FakeAudioContext.instances).toHaveLength(0);
    await expect(startRecording(false, asLogger)).rejects.toThrow(
      'Transcription is already running',
    );
  });

  it('records the microphone and the screen when the plan asks for them', async () => {
    const tab = tabStream();
    const mic = micStream();
    devices.getDisplayMedia.mockResolvedValue(tab);
    devices.getUserMedia.mockResolvedValue(mic);
    replies['recorder/prepare'] = { ok: true, data: plan({ captureMic: true, saveVideo: true }) };
    const { startRecording } = await load();
    await startRecording(false, asLogger);
    expect(sentTypes()).toEqual(['recorder/prepare', 'recorder/started']);
    expect(sent()[1]).toEqual({ type: 'recorder/started', micEnabled: true });
    const [tabAudio, micAudio, screen] = FakeRecorder.instances;
    expect(tabAudio.stream.getTracks()).toEqual(tab.getAudioTracks());
    expect(micAudio.stream).toBe(mic);
    const [context] = FakeAudioContext.instances;
    expect(screen.stream.getTracks()).toEqual([
      ...tab.getVideoTracks(),
      context.destination.stream.tracks[0],
    ]);
    expect(screen.timeslice).toBe(5000);
    expect(tab.getVideoTracks()[0].stop).not.toHaveBeenCalled();
  });

  it('tells the user when the microphone is unavailable and records the call alone', async () => {
    devices.getDisplayMedia.mockResolvedValue(tabStream());
    devices.getUserMedia.mockRejectedValue(new Error('NotAllowedError'));
    replies['recorder/prepare'] = { ok: true, data: plan({ captureMic: true }) };
    const { startRecording } = await load();
    await startRecording(false, asLogger);
    await vi.waitFor(() => expect(sentTypes()).toContain('recorder/notice'));
    expect(sent()[1]).toEqual({ type: 'recorder/started', micEnabled: false });
    expect(sent()[2]).toEqual({ type: 'recorder/notice', reason: NO_MIC });
    expect(FakeRecorder.instances).toHaveLength(1);
  });

  it('never asks the worker when the share is cancelled', async () => {
    devices.getDisplayMedia.mockRejectedValue(new Error('NotAllowedError'));
    const { startRecording } = await load();
    await expect(startRecording(true, asLogger)).rejects.toThrow(/cancelled/);
    expect(sentTypes()).toEqual([]);
  });

  it('releases the share when the worker refuses the start, and can start again', async () => {
    const tab = tabStream();
    devices.getDisplayMedia.mockResolvedValue(tab);
    replies['recorder/prepare'] = {
      ok: false,
      error: 'Join the call before starting transcription',
    };
    const { startRecording } = await load();
    await expect(startRecording(false, asLogger)).rejects.toThrow('Join the call');
    expect(tab.tracks.every((track) => track.readyState === 'ended')).toBe(true);
    replies['recorder/prepare'] = { ok: true, data: plan() };
    devices.getDisplayMedia.mockResolvedValue(tabStream());
    await expect(startRecording(false, asLogger)).resolves.toBeUndefined();
  });

  it('releases every recorder, the microphone and the mixer when the start fails late', async () => {
    const tab = tabStream();
    const mic = micStream();
    devices.getDisplayMedia.mockResolvedValue(tab);
    devices.getUserMedia.mockResolvedValue(mic);
    replies['recorder/prepare'] = { ok: true, data: plan({ captureMic: true, saveVideo: true }) };
    replies['recorder/started'] = { ok: false, error: 'Refused: not from a Meet tab' };
    const { startRecording } = await load();
    await expect(startRecording(false, asLogger)).rejects.toThrow('Refused: not from a Meet tab');
    expect(FakeRecorder.instances.map((recorder) => recorder.state)).toEqual([
      'inactive',
      'inactive',
      'inactive',
    ]);
    expect(mic.tracks[0].stop).toHaveBeenCalled();
    expect(tab.tracks.every((track) => track.readyState === 'ended')).toBe(true);
    expect(FakeAudioContext.instances[0].close).toHaveBeenCalled();
  });
});

describe('while recording', () => {
  async function recording(overrides: Partial<CapturePlan> = {}) {
    const tab = tabStream();
    devices.getDisplayMedia.mockResolvedValue(tab);
    devices.getUserMedia.mockResolvedValue(micStream());
    replies['recorder/prepare'] = { ok: true, data: plan(overrides) };
    const recorder = await load();
    await recorder.startRecording(false, asLogger);
    chrome.runtime.sendMessage.mockClear();
    return { ...recorder, tab };
  }

  it('hands over chunks and pieces in order, then reports the end', async () => {
    const { stopOnLeave } = await recording({ saveVideo: true });
    await vi.advanceTimersByTimeAsync(5000);
    FakeRecorder.instances[1].emitData();
    await vi.advanceTimersByTimeAsync(10_000);
    await vi.waitFor(() => expect(sentTypes()).toEqual(['recorder/video', 'recorder/audio']));
    await vi.advanceTimersByTimeAsync(1000);
    await stopOnLeave(asLogger);
    expect(sentTypes()).toEqual([
      'recorder/video',
      'recorder/audio',
      'recorder/audio',
      'recorder/video',
      'recorder/ended',
    ]);
    expect(sent()[0]).toEqual({
      type: 'recorder/video',
      piece: { meetingId: 'm1', part: 2, seq: 0, durationMs: 5000, data: 'd2VibQ==' },
    });
    expect(sent()[1]).toEqual({
      type: 'recorder/audio',
      chunk: {
        meetingId: 'm1',
        stream: 'TAB',
        startMs: 60_000,
        durationMs: 15_000,
        audio: 'd2VibQ==',
      },
    });
    expect(sent()[4]).toEqual({ type: 'recorder/ended', reason: null });
    await stopOnLeave(asLogger);
    expect(sentTypes()).toHaveLength(5);
  });

  it('stops by itself when the tab share ends, with the reason', async () => {
    const { tab } = await recording({ saveVideo: true });
    tab.getVideoTracks()[0].end();
    await vi.waitFor(() =>
      expect(sent()).toContainEqual({ type: 'recorder/ended', reason: SHARE_ENDED }),
    );
    expect(FakeAudioContext.instances[0].close).toHaveBeenCalled();
  });

  it('stops when the shared tab audio ends, and logs a release that failed', async () => {
    const { tab } = await recording({ saveVideo: true });
    FakeAudioContext.instances[0].close.mockRejectedValue(new Error('closed'));
    tab.getAudioTracks()[0].end();
    await vi.waitFor(() =>
      expect(logger.error).toHaveBeenCalledWith(
        'Could not stop after the tab share ended',
        new Error('closed'),
      ),
    );
  });

  it('logs a report the worker refused and carries on', async () => {
    const { stopOnLeave } = await recording();
    replies['recorder/audio'] = { ok: false, error: 'Refused' };
    await vi.advanceTimersByTimeAsync(15_000);
    await stopOnLeave(asLogger);
    expect(logger.warn).toHaveBeenCalledWith(
      'The worker did not take a recording report',
      new Error('Refused'),
    );
    expect(sentTypes().at(-1)).toBe('recorder/ended');
  });

  it('logs a chunk that could not be recorded', async () => {
    await recording();
    FakeRecorder.failNext = true;
    await vi.advanceTimersByTimeAsync(15_000);
    expect(logger.error).toHaveBeenCalledWith(
      'A transcription chunk could not be recorded',
      new Error('NotSupportedError'),
    );
  });
});

describe('worker commands', () => {
  const command = (type: string) => dispatchMessage(chrome, { target: 'recorder', type });

  it('pauses, resumes and stops on command, answering once done', async () => {
    const tab = tabStream();
    devices.getDisplayMedia.mockResolvedValue(tab);
    replies['recorder/prepare'] = { ok: true, data: plan({ saveVideo: true }) };
    const { listenForCommands, startRecording } = await load();
    const stop = listenForCommands(asLogger);
    await startRecording(false, asLogger);
    const [segment, video] = FakeRecorder.instances;
    await expect(command('recorder/pause')).resolves.toEqual({ ok: true, data: null });
    expect([segment.state, video.state]).toEqual(['inactive', 'paused']);
    await expect(command('recorder/resume')).resolves.toEqual({ ok: true, data: null });
    expect(video.state).toBe('recording');
    expect(FakeRecorder.instances[2].state).toBe('recording');
    await expect(command('recorder/stop')).resolves.toEqual({ ok: true, data: null });
    expect(sentTypes().at(-1)).toBe('recorder/ended');
    await expect(command('recorder/stop')).resolves.toEqual({ ok: true, data: null });
    expect(sentTypes().filter((type) => type === 'recorder/ended')).toHaveLength(2);
    await expect(command('recorder/pause')).resolves.toEqual({ ok: true, data: null });
    await expect(command('recorder/resume')).resolves.toEqual({ ok: true, data: null });
    stop();
    expect(chrome.runtime.onMessage.listeners.size).toBe(0);
  });

  it('answers an error when a command fails', async () => {
    devices.getDisplayMedia.mockResolvedValue(tabStream());
    replies['recorder/prepare'] = { ok: true, data: plan({ saveVideo: true }) };
    const { listenForCommands, startRecording } = await load();
    listenForCommands(asLogger);
    await startRecording(false, asLogger);
    FakeAudioContext.instances[0].close.mockRejectedValue(new Error('closed'));
    await expect(command('recorder/stop')).resolves.toEqual({
      ok: false,
      error: 'The recorder did not respond. Try again.',
    });
    expect(logger.error).toHaveBeenCalledWith(
      'The recorder could not follow a command',
      new Error('closed'),
    );
  });

  it('ignores messages that are not recorder commands', async () => {
    const { listenForCommands } = await load();
    listenForCommands(asLogger);
    await expect(dispatchMessage(chrome, { type: 'state/changed' })).resolves.toBeUndefined();
    await expect(dispatchMessage(chrome, { target: 'other' })).resolves.toBeUndefined();
    await expect(dispatchMessage(chrome, null)).resolves.toBeUndefined();
    await expect(dispatchMessage(chrome, 'text')).resolves.toBeUndefined();
  });

  it('has nothing to hand over when the page leaves without recording', async () => {
    const { stopOnLeave } = await load();
    await expect(stopOnLeave(asLogger)).resolves.toBeUndefined();
    expect(sentTypes()).toEqual([]);
  });
});
