import type { CapturePlan } from '../types/meeting';
import type { RecorderCommand, RecorderReport, WorkerReply } from '../types/messages';
import { isCapturing, type TabSession } from '../storage/session-registry';
import { assertCapturable, uploadFailureMessage } from './logic/capture-rules';
import { maybeFinalize } from './finalize';
import { getOrg } from './org';
import { api, logger, prefsStore, registry } from './services';
import { publish } from './state';
import { handleAudio, handleVideo, uploadsBehind } from './uploads';

/** One transcription chunk: short enough for a live transcript, long enough for context. */
const CHUNK_MS = 15_000;
/** One screen-recording piece, streamed to the portal while the call runs. */
const PIECE_MS = 5_000;

export const HEARTBEAT_ALARM = 'heartbeat';

export async function ensureHeartbeat(): Promise<void> {
  if ((await chrome.alarms.get(HEARTBEAT_ALARM)) === undefined) {
    await chrome.alarms.create(HEARTBEAT_ALARM, { periodInMinutes: 1 });
  }
}

/**
 * Sends a command to the recorder in the Meet page. Answers false when the page is gone
 * (closed or reloaded), which also means its recorder is gone.
 */
async function commandRecorder(tabId: number, type: RecorderCommand['type']): Promise<boolean> {
  const command: RecorderCommand = { target: 'recorder', type };
  let reply: WorkerReply<null> | undefined;
  try {
    reply = (await chrome.tabs.sendMessage(tabId, command)) as WorkerReply<null> | undefined;
  } catch (error) {
    logger.info('The Meet page did not take a recorder command', { type, error: String(error) });
    return false;
  }
  if (reply?.ok === false) {
    throw new Error(reply.error);
  }
  return true;
}

async function stopRecorder(session: TabSession): Promise<void> {
  if (session.recorderActive && !(await commandRecorder(session.tabId, 'recorder/stop'))) {
    await recorderEnded(session.tabId, null);
  }
}

/** Fails the capture of every tab of the meeting, with a message the user can act on. */
export async function failCapture(meetingId: string, message: string): Promise<void> {
  const capturing = (await registry.all()).filter(
    (s) => s.meetingId === meetingId && isCapturing(s),
  );
  await Promise.all(
    capturing.map(async (session) => {
      await stopRecorder(session);
      await registry.update(session.tabId, (s) => ({
        ...s,
        captureState: 'ERROR',
        captureError: message,
      }));
      await publish(session.tabId);
    }),
  );
}

export async function recordConsent(tabId: number): Promise<void> {
  const session = await registry.get(tabId);
  if (session?.meetingId == null) {
    throw new Error('Join the call before starting transcription');
  }
  const meeting = await api.recordConsent(session.meetingId);
  await registry.update(tabId, (s) => ({
    ...s,
    consentRecorded: meeting.consentRecordedAt !== null,
  }));
  await publish(tabId);
}

/** Checks a start the user asked for in the page; answers the plan the recorder follows. */
async function prepareCapture(tabId: number): Promise<CapturePlan> {
  const session = await registry.get(tabId);
  const org = await getOrg();
  const other =
    session?.meetingId == null ? null : await registry.captureOwner(session.meetingId, tabId);
  assertCapturable(session, org, other);
  const prefs = await prefsStore.read();
  return {
    meetingId: session.meetingId,
    meetingStartedAtMs: Date.parse(session.meetingStartedAt),
    captureMic: prefs.captureMicrophone,
    chunkMs: CHUNK_MS,
    pieceMs: PIECE_MS,
    saveVideo: org?.saveRecordings === true,
    videoPart: session.videoPart,
  };
}

/** The tab is shared and recording: the next start is a new part of the screen recording. */
async function captureStarted(tabId: number, micEnabled: boolean): Promise<void> {
  await registry.update(tabId, (s) => ({
    ...s,
    captureState: 'RECORDING',
    captureStartedAt: s.captureStartedAt ?? Date.now(),
    captureError: null,
    micEnabled,
    recorderActive: true,
    videoPart: s.videoPart + 1,
  }));
  await ensureHeartbeat();
  logger.info('Capture started', { mic: micEnabled });
  await publish(tabId);
}

/** Pauses capture; `notice` (an English source string) explains an automatic pause. */
export async function pauseCapture(tabId: number, notice: string | null = null): Promise<void> {
  const session = await registry.get(tabId);
  if (session?.captureState !== 'RECORDING') {
    return;
  }
  await commandRecorder(tabId, 'recorder/pause');
  await registry.update(tabId, (s) => ({ ...s, captureState: 'PAUSED', captureError: notice }));
  await publish(tabId);
}

export async function resumeCapture(tabId: number): Promise<void> {
  const session = await registry.get(tabId);
  if (session?.captureState !== 'PAUSED' || !session.recorderActive) {
    throw new Error('Start transcription again from the assistant panel');
  }
  if (uploadsBehind()) {
    throw new Error(uploadFailureMessage('backpressure'));
  }
  if (!(await commandRecorder(tabId, 'recorder/resume'))) {
    throw new Error('Start transcription again from the assistant panel');
  }
  await registry.update(tabId, (s) => ({ ...s, captureState: 'RECORDING', captureError: null }));
  await publish(tabId);
}

/** Stops capture; `notice` (an English source string) explains an automatic stop. */
export async function stopCapture(tabId: number, notice: string | null): Promise<void> {
  const session = await registry.get(tabId);
  if (session === null || !(isCapturing(session) || session.captureState === 'ERROR')) {
    return;
  }
  await stopRecorder(session);
  await registry.update(tabId, (s) => ({ ...s, captureState: 'STOPPED', captureError: notice }));
  await publish(tabId);
}

/** The recorder flushed and released everything; `error` when it stopped on its own. */
async function recorderEnded(tabId: number, error: string | null): Promise<void> {
  const session = await registry.update(tabId, (s) => ({
    ...s,
    recorderActive: false,
    captureState: error === null ? s.captureState : 'STOPPED',
    captureError: error ?? s.captureError,
  }));
  if (session !== null) {
    await maybeFinalize(tabId);
    await publish(tabId);
  }
}

async function showNotice(tabId: number, reason: string): Promise<void> {
  await registry.update(tabId, (s) => ({ ...s, captureError: reason }));
  await publish(tabId);
}

/** Everything the recorder in a Meet tab reports. */
export function handleRecorderReport(tabId: number, report: RecorderReport): Promise<unknown> {
  switch (report.type) {
    case 'recorder/prepare':
      return prepareCapture(tabId);
    case 'recorder/started':
      return captureStarted(tabId, report.micEnabled);
    case 'recorder/audio':
      return handleAudio(report.chunk);
    case 'recorder/video':
      return handleVideo(report.piece);
    case 'recorder/ended':
      return recorderEnded(tabId, report.reason);
    case 'recorder/notice':
      return showNotice(tabId, report.reason);
  }
}
