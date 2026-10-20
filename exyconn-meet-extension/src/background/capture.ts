import type { OffscreenReport } from '../types/messages';
import { isCapturing, type TabSession } from '../storage/session-registry';
import { createUploadQueue } from '../services/upload-queue';
import { assertCapturable, uploadFailureMessage } from './logic/capture-rules';
import { addLiveSegments } from './live-segments';
import { maybeFinalize } from './finalize';
import { closeOffscreen, commandOffscreen, ensureOffscreen } from './offscreen-doc';
import { getOrg } from './org';
import { api, logger, prefsStore, registry, uploadAudio } from './services';
import { publish } from './state';
import { logTo } from '../services/logger';
import { errorText } from '../utils/errors';

/** Each chunk is ~25 s of audio: one self-contained WAV file. */
const CHUNK_MS = 25_000;
/** Queued chunks before capture pauses, and the hard limit (room for the flush on pause). */
const HIGH_WATER = 8;
const CAPACITY = 12;

export const HEARTBEAT_ALARM = 'heartbeat';

export async function ensureHeartbeat(): Promise<void> {
  if ((await chrome.alarms.get(HEARTBEAT_ALARM)) === undefined) {
    await chrome.alarms.create(HEARTBEAT_ALARM, { periodInMinutes: 1 });
  }
}

async function sessionsOf(meetingId: string): Promise<TabSession[]> {
  return (await registry.all()).filter((s) => s.meetingId === meetingId);
}

async function stopRecorder(session: TabSession): Promise<void> {
  if (session.recorderActive) {
    await commandOffscreen({
      target: 'offscreen',
      type: 'offscreen/stop',
      sessionKey: session.sessionKey,
    });
  }
}

/** Fails the capture of every tab of the meeting, with a message the user can act on. */
async function failCapture(meetingId: string, message: string): Promise<void> {
  const capturing = (await sessionsOf(meetingId)).filter(isCapturing);
  await Promise.all(capturing.map((session) => failOne(session, message)));
}

async function failOne(session: TabSession, message: string): Promise<void> {
  await stopRecorder(session);
  await registry.update(session.tabId, (s) => ({
    ...s,
    captureState: 'ERROR',
    captureError: message,
  }));
  await publish(session.tabId);
}

/** A retry waits in the worker; an in-flight upload keeps the worker alive until then. */
export function scheduleRetry(run: () => void, delayMs: number): void {
  setTimeout(run, delayMs);
}

const queue = createUploadQueue({
  upload: uploadAudio,
  capacity: CAPACITY,
  highWater: HIGH_WATER,
  maxAttempts: 6,
  backoff: { baseMs: 2000, maxMs: 60_000 },
  schedule: scheduleRetry,
  onUploaded: (chunk, outcome) => addLiveSegments(chunk.meetingId, outcome.segments),
  onFailed: (chunk, reason) => {
    logger.warn('Audio upload failed', undefined, { reason, stream: chunk.stream });
    failCapture(chunk.meetingId, uploadFailureMessage(reason)).catch(
      logTo(logger, 'Could not stop capture after a failed upload', 'error'),
    );
  },
  onSizeChange: (meetingId, size) => {
    syncPending(meetingId, size).catch(logTo(logger, 'Could not update the upload count', 'error'));
  },
  onError: logTo(logger, 'The upload queue stopped', 'error'),
});

async function syncPending(meetingId: string, size: number): Promise<void> {
  const sessions = await sessionsOf(meetingId);
  await Promise.all(sessions.map((session) => syncOne(session.tabId, size)));
}

async function syncOne(tabId: number, size: number): Promise<void> {
  await registry.update(tabId, (s) => ({ ...s, pendingUploads: size }));
  await maybeFinalize(tabId);
  await publish(tabId);
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

/** Starts capture after the user's click. Throws an English message when it may not start. */
export async function startCapture(tabId: number): Promise<void> {
  const session = await registry.get(tabId);
  const org = await getOrg();
  const other =
    session?.meetingId == null ? null : await registry.captureOwner(session.meetingId, tabId);
  assertCapturable(session, org, other);
  let streamId: string;
  try {
    streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabId });
  } catch (error) {
    logger.warn('Tab capture was refused', error);
    throw new Error('Open the Exyconn toolbar button on this tab, then start transcription there', {
      cause: error,
    });
  }
  const prefs = await prefsStore.read();
  await ensureOffscreen();
  await registry.update(tabId, (s) => ({
    ...s,
    captureState: 'RECORDING',
    captureStartedAt: s.captureStartedAt ?? Date.now(),
    captureError: null,
    micEnabled: prefs.captureMicrophone,
    recorderActive: true,
  }));
  try {
    await commandOffscreen({
      target: 'offscreen',
      type: 'offscreen/start',
      sessionKey: session.sessionKey,
      tabId,
      meetingId: session.meetingId,
      streamId,
      meetingStartedAtMs: Date.parse(session.meetingStartedAt),
      captureMic: prefs.captureMicrophone,
      chunkMs: CHUNK_MS,
    });
  } catch (error) {
    const message = errorText(error, 'The recorder could not start');
    await registry.update(tabId, (s) => ({
      ...s,
      captureState: 'ERROR',
      captureError: message,
      recorderActive: false,
    }));
    await publish(tabId);
    throw error;
  }
  await ensureHeartbeat();
  logger.info('Capture started', { mic: prefs.captureMicrophone });
  await publish(tabId);
}

/** Pauses capture; `notice` (an English source string) explains an automatic pause. */
export async function pauseCapture(tabId: number, notice: string | null = null): Promise<void> {
  const session = await registry.get(tabId);
  if (session?.captureState !== 'RECORDING') {
    return;
  }
  await commandOffscreen({
    target: 'offscreen',
    type: 'offscreen/pause',
    sessionKey: session.sessionKey,
  });
  await registry.update(tabId, (s) => ({ ...s, captureState: 'PAUSED', captureError: notice }));
  await publish(tabId);
}

export async function resumeCapture(tabId: number): Promise<void> {
  const session = await registry.get(tabId);
  if (session?.captureState !== 'PAUSED' || !session.recorderActive) {
    throw new Error('Start transcription again from the toolbar button');
  }
  if (queue.size() >= HIGH_WATER) {
    throw new Error(uploadFailureMessage('backpressure'));
  }
  await commandOffscreen({
    target: 'offscreen',
    type: 'offscreen/resume',
    sessionKey: session.sessionKey,
  });
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

async function handleChunk(
  report: Extract<OffscreenReport, { type: 'offscreen/chunk' }>,
): Promise<void> {
  const owner = (await sessionsOf(report.meetingId)).find((s) => s.consentRecorded);
  if (owner === undefined) {
    logger.warn('Dropped audio for a meeting without consent on record');
    return;
  }
  const seq = await registry.takeSeq(report.meetingId, report.stream);
  const result = queue.enqueue({
    meetingId: report.meetingId,
    tabId: owner.tabId,
    stream: report.stream,
    seq,
    startMs: report.startMs,
    durationMs: report.durationMs,
    audio: report.audio,
  });
  if (!result.accepted) {
    logger.warn('Audio chunk refused by the upload queue', undefined, { reason: result.reason });
  }
  if (!result.accepted || result.backpressure) {
    await pauseCapture(owner.tabId, uploadFailureMessage('backpressure'));
  }
}

async function recorderStopped(sessionKey: string, error: string | null): Promise<void> {
  const session = (await registry.all()).find((s) => s.sessionKey === sessionKey);
  if (session !== undefined) {
    await registry.update(session.tabId, (s) => ({
      ...s,
      recorderActive: false,
      captureState: error === null ? s.captureState : 'ERROR',
      captureError: error ?? s.captureError,
    }));
    await maybeFinalize(session.tabId);
    await publish(session.tabId);
  }
  if (!(await registry.all()).some((s) => s.recorderActive)) {
    await closeOffscreen();
  }
}

/** Everything the offscreen recorder reports. */
export async function handleOffscreenReport(report: OffscreenReport): Promise<void> {
  if (report.type === 'offscreen/chunk') {
    await handleChunk(report);
    return;
  }
  if (report.type === 'offscreen/error') {
    logger.warn('The recorder stopped with an error', undefined, { reason: report.reason });
    await recorderStopped(report.sessionKey, report.reason);
    return;
  }
  if (report.reason === 'stopped') {
    await recorderStopped(report.sessionKey, null);
    return;
  }
  const session = (await registry.all()).find((s) => s.sessionKey === report.sessionKey);
  if (session !== undefined) {
    await registry.update(session.tabId, (s) => ({
      ...s,
      micEnabled: false,
      captureError: report.reason,
    }));
    await publish(session.tabId);
  }
}
