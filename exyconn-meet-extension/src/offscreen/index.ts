/**
 * The offscreen recorder (16 kHz mono PCM16 WAV chunks via an AudioWorklet). It holds the tab's audio stream (and, if the user enabled it and
 * granted permission, the microphone), plays the tab audio back so the user still hears the
 * call, and sends each ~25 s chunk to the worker. It starts only on the worker's command,
 * which follows the user's click and recorded consent — it never records on its own.
 */
import { captureBrowserErrors } from '@exyconn/logger';
import { createExtensionLogger, logTo } from '../services/logger';
import { askWorker, relayLogs } from '../services/messaging';
import type { OffscreenCommand, OffscreenReport, WorkerReply } from '../types/messages';
import type { AudioStream } from '../types/meeting';
import { createChunkRecorder, type ChunkRecorder, type RecordedChunk } from './recorder';

const logger = createExtensionLogger('offscreen', relayLogs);
captureBrowserErrors(logger, globalThis);

interface Capture {
  streams: MediaStream[];
  context: AudioContext;
  recorders: ChunkRecorder[];
}

type StartCommand = Extract<OffscreenCommand, { type: 'offscreen/start' }>;

const captures = new Map<string, Capture>();

/** Chrome's tab-capture constraint, which the DOM typings do not describe. */
interface TabAudioConstraints {
  audio: { mandatory: { chromeMediaSource: 'tab'; chromeMediaSourceId: string } };
  video: false;
}

function send(report: OffscreenReport): Promise<unknown> {
  return askWorker(report);
}

async function sendChunk(command: StartCommand, chunk: RecordedChunk): Promise<void> {
  await send({
    type: 'offscreen/chunk',
    sessionKey: command.sessionKey,
    meetingId: command.meetingId,
    stream: chunk.stream,
    startMs: chunk.startedAt - command.meetingStartedAtMs,
    durationMs: chunk.durationMs,
    audio: chunk.audio,
  });
}

async function microphone(command: StartCommand): Promise<MediaStream | null> {
  if (!command.captureMic) {
    return null;
  }
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true } });
  } catch (error) {
    logger.warn('Microphone unavailable', error);
    await send({
      type: 'offscreen/notice',
      sessionKey: command.sessionKey,
      reason: 'The microphone is not available, so only the meeting audio is transcribed',
    });
    return null;
  }
}

function record(
  command: StartCommand,
  source: MediaStream,
  stream: AudioStream,
): Promise<ChunkRecorder> {
  return createChunkRecorder(
    source,
    stream,
    command.chunkMs,
    (chunk) => sendChunk(command, chunk),
    logTo(logger, 'Could not hand over a chunk', 'error'),
  );
}

/** Flushes the last chunks and releases the streams. False when nothing was recording. */
async function teardown(sessionKey: string): Promise<boolean> {
  const capture = captures.get(sessionKey);
  if (capture === undefined) {
    return false;
  }
  captures.delete(sessionKey);
  await Promise.all(capture.recorders.map((recorder) => recorder.stop()));
  for (const stream of capture.streams) {
    for (const track of stream.getTracks()) {
      track.stop();
    }
  }
  await capture.context.close();
  return true;
}

async function stop(sessionKey: string, error: string | null): Promise<void> {
  if (!(await teardown(sessionKey))) {
    return;
  }
  await send(
    error === null
      ? { type: 'offscreen/notice', sessionKey, reason: 'stopped' }
      : { type: 'offscreen/error', sessionKey, reason: error },
  );
}

async function start(command: StartCommand): Promise<void> {
  // A restart after an error may arrive before the old recorder finished stopping.
  await teardown(command.sessionKey);
  const constraints: TabAudioConstraints = {
    audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: command.streamId } },
    video: false,
  };
  const tab = await navigator.mediaDevices.getUserMedia(constraints as MediaStreamConstraints);
  // Capturing a tab mutes it; a separate default-rate context plays it back so the call
  // stays audible. The 16 kHz capture contexts (recorder.ts) never reach the speakers.
  const context = new AudioContext();
  context.createMediaStreamSource(tab).connect(context.destination);
  const mic = await microphone(command);
  const recorders = [await record(command, tab, 'TAB')];
  if (mic !== null) {
    recorders.push(await record(command, mic, 'MIC'));
  }
  captures.set(command.sessionKey, {
    streams: mic === null ? [tab] : [tab, mic],
    context,
    recorders,
  });
  tab.getAudioTracks()[0]?.addEventListener('ended', () => {
    stop(command.sessionKey, 'The meeting audio ended, so transcription stopped').catch(
      logTo(logger, 'Could not stop after the tab audio ended', 'error'),
    );
  });
}

async function handle(command: OffscreenCommand): Promise<void> {
  const capture = captures.get(command.sessionKey);
  switch (command.type) {
    case 'offscreen/start':
      return start(command);
    case 'offscreen/pause':
      await Promise.all(capture?.recorders.map((recorder) => recorder.pause()) ?? []);
      return;
    case 'offscreen/resume':
      capture?.recorders.forEach((recorder) => recorder.resume());
      return;
    case 'offscreen/stop':
      return stop(command.sessionKey, null);
  }
}

function isCommand(message: unknown): message is OffscreenCommand {
  return (
    typeof message === 'object' &&
    message !== null &&
    'target' in message &&
    message.target === 'offscreen'
  );
}

chrome.runtime.onMessage.addListener(
  (message: unknown, _sender, sendResponse: (reply: WorkerReply<null>) => void) => {
    if (!isCommand(message)) {
      return false;
    }
    handle(message)
      .then(() => sendResponse({ ok: true, data: null }))
      .catch((error: unknown) => {
        logger.error('The recorder failed', error);
        sendResponse({
          ok: false,
          error: 'The recorder could not start. Check that the tab is still open.',
        });
      });
    return true;
  },
);
