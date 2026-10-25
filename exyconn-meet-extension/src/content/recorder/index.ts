/**
 * The recorder, inside the Meet page. The user starts it from the assistant panel: Chrome
 * asks to share this tab (video and the call's audio), the worker checks the start and
 * answers a plan, and from then on the page hands the worker a transcription chunk every
 * ~15 s and a screen-recording piece every ~5 s, which the worker uploads as they come.
 * It never records on its own: only a click, after consent is on record, starts it.
 */
import type { Logger } from '@exyconn/logger';
import { logTo } from '../../services/logger';
import { askWorker } from '../../services/messaging';
import type { AudioStream, CapturePlan } from '../../types/meeting';
import type { RecorderCommand, RecorderReport, WorkerReply } from '../../types/messages';
import { bytesToBase64 } from '../../utils/base64';
import { audioOnly, mixAudio, openMicrophone, shareThisTab, stopTracks } from './media';
import { createSegmentRecorder, type RecordedSegment, type SegmentRecorder } from './segments';
import { createVideoRecorder, type RecordedPiece, type VideoRecorder } from './video';

interface Recording {
  streams: MediaStream[];
  context: AudioContext | null;
  segments: SegmentRecorder[];
  video: VideoRecorder | null;
}

const MIC_UNAVAILABLE = 'The microphone is not available, so only the meeting audio is transcribed';

let active: Recording | null = null;
let outbox: Promise<void> = Promise.resolve();

const base64Of = async (blob: Blob): Promise<string> =>
  bytesToBase64(new Uint8Array(await blob.arrayBuffer()));

/** Reports leave one at a time, in the order they were made; a refusal is logged, not fatal. */
function report(logger: Logger, build: () => Promise<RecorderReport> | RecorderReport): void {
  outbox = outbox
    .then(async () => {
      await askWorker(await build());
    })
    .catch(logTo(logger, 'The worker did not take a recording report'));
}

function sendAudio(logger: Logger, plan: CapturePlan, stream: AudioStream) {
  return (segment: RecordedSegment): void => {
    report(logger, async () => ({
      type: 'recorder/audio',
      chunk: {
        meetingId: plan.meetingId,
        stream,
        startMs: Math.max(0, segment.startedAt - plan.meetingStartedAtMs),
        durationMs: segment.durationMs,
        audio: await base64Of(segment.blob),
      },
    }));
  };
}

function sendVideo(logger: Logger, plan: CapturePlan) {
  return (piece: RecordedPiece): void => {
    report(logger, async () => ({
      type: 'recorder/video',
      piece: {
        meetingId: plan.meetingId,
        part: plan.videoPart,
        seq: piece.seq,
        durationMs: piece.durationMs,
        data: await base64Of(piece.blob),
      },
    }));
  };
}

/** Flushes every recorder, then releases the tab share, the microphone and the mixer. */
async function release(recording: Recording): Promise<void> {
  await Promise.all([
    ...recording.segments.map((segment) => segment.stop()),
    recording.video?.stop(),
  ]);
  recording.streams.forEach(stopTracks);
  await recording.context?.close();
}

/** Stops recording and tells the worker once the last chunk is handed over. */
async function finish(logger: Logger, reason: string | null): Promise<void> {
  const recording = active;
  active = null;
  if (recording !== null) {
    await release(recording);
  }
  report(logger, () => ({ type: 'recorder/ended', reason }));
  await outbox;
}

function begin(plan: CapturePlan, tab: MediaStream, mic: MediaStream | null, logger: Logger) {
  const onError = logTo(logger, 'A transcription chunk could not be recorded', 'error');
  const segments = [
    createSegmentRecorder(audioOnly(tab), plan.chunkMs, sendAudio(logger, plan, 'TAB'), onError),
  ];
  if (mic !== null) {
    segments.push(
      createSegmentRecorder(mic, plan.chunkMs, sendAudio(logger, plan, 'MIC'), onError),
    );
  }
  let context: AudioContext | null = null;
  let video: VideoRecorder | null = null;
  if (plan.saveVideo) {
    context = new AudioContext();
    const soundtrack = mixAudio(context, tab, mic);
    const screen = new MediaStream([...tab.getVideoTracks(), soundtrack]);
    video = createVideoRecorder(screen, plan.pieceMs, sendVideo(logger, plan));
  } else {
    // The company keeps no recordings: only the call's audio is needed, for the transcript.
    tab.getVideoTracks().forEach((track) => track.stop());
  }
  const ended = (): void => {
    finish(logger, 'Sharing this tab stopped, so transcription stopped').catch(
      logTo(logger, 'Could not stop after the tab share ended', 'error'),
    );
  };
  tab.getAudioTracks()[0]?.addEventListener('ended', ended, { once: true });
  tab.getVideoTracks()[0]?.addEventListener('ended', ended, { once: true });
  active = { streams: mic === null ? [tab] : [tab, mic], context, segments, video };
}

/**
 * Starts recording after the user's click. Shares the tab FIRST, while the click still
 * counts, then records consent if asked, checks the start with the worker and begins.
 */
export async function startRecording(needsConsent: boolean, logger: Logger): Promise<void> {
  if (active !== null) {
    throw new Error('Transcription is already running');
  }
  const tab = await shareThisTab();
  let mic: MediaStream | null = null;
  try {
    if (needsConsent) {
      await askWorker({ type: 'capture/consent' });
    }
    const plan = await askWorker<CapturePlan>({ type: 'recorder/prepare' });
    mic = plan.captureMic ? await openMicrophone() : null;
    begin(plan, tab, mic, logger);
    await askWorker({ type: 'recorder/started', micEnabled: mic !== null });
    if (plan.captureMic && mic === null) {
      report(logger, () => ({ type: 'recorder/notice', reason: MIC_UNAVAILABLE }));
    }
  } catch (error) {
    const recording = active;
    active = null;
    await (recording === null ? Promise.resolve() : release(recording));
    stopTracks(tab);
    stopTracks(mic);
    throw error;
  }
}

async function obey(command: RecorderCommand, logger: Logger): Promise<void> {
  if (command.type === 'recorder/stop') {
    await finish(logger, null);
    return;
  }
  if (command.type === 'recorder/pause') {
    active?.video?.pause();
    await Promise.all(active?.segments.map((segment) => segment.pause()) ?? []);
    return;
  }
  active?.video?.resume();
  active?.segments.forEach((segment) => segment.resume());
}

function isCommand(message: unknown): message is RecorderCommand {
  return (
    typeof message === 'object' &&
    message !== null &&
    'target' in message &&
    message.target === 'recorder'
  );
}

/** Takes the worker's pause / resume / stop; answers once the recorder has done it. */
export function listenForCommands(logger: Logger): () => void {
  const onCommand = (
    message: unknown,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (reply: WorkerReply<null>) => void,
  ): boolean => {
    if (!isCommand(message)) {
      return false;
    }
    obey(message, logger)
      .then(() => sendResponse({ ok: true, data: null }))
      .catch((error: unknown) => {
        logger.error('The recorder could not follow a command', error);
        sendResponse({ ok: false, error: 'The recorder did not respond. Try again.' });
      });
    return true;
  };
  chrome.runtime.onMessage.addListener(onCommand);
  return () => chrome.runtime.onMessage.removeListener(onCommand);
}

/** The page is going away: hand over what is recorded so far. */
export function stopOnLeave(logger: Logger): Promise<void> {
  return active === null ? Promise.resolve() : finish(logger, null);
}
