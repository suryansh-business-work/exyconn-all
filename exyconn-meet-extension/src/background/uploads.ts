import type { TabSession } from '../storage/session-registry';
import type { AudioChunk } from '../services/audio-upload';
import { createUploadQueue, type EnqueueResult } from '../services/upload-queue';
import type { VideoPiece } from '../services/video-upload';
import type { RecordedAudio, RecordedVideo } from '../types/meeting';
import { logTo } from '../services/logger';
import { uploadFailureMessage } from './logic/capture-rules';
import { addLiveSegments } from './live-segments';
import { failCapture, pauseCapture } from './capture';
import { maybeFinalize } from './finalize';
import { logger, registry, uploadAudio, uploadVideo } from './services';
import { publish } from './state';

/** Queued chunks before capture pauses, and the hard limit (room for the flush on pause). */
const HIGH_WATER = 8;
const CAPACITY = 12;
/** Screen pieces are shorter (5 s), so more of them fit in the same minute of backlog. */
const VIDEO_HIGH_WATER = 24;
const VIDEO_CAPACITY = 36;

/** A retry waits in the worker; an in-flight upload keeps the worker alive until then. */
export function scheduleRetry(run: () => void, delayMs: number): void {
  setTimeout(run, delayMs);
}

async function sessionsOf(meetingId: string): Promise<TabSession[]> {
  return (await registry.all()).filter((s) => s.meetingId === meetingId);
}

async function syncPending(meetingId: string): Promise<void> {
  const size = audioQueue.sizeFor(meetingId) + videoQueue.sizeFor(meetingId);
  const sessions = await sessionsOf(meetingId);
  await Promise.all(
    sessions.map(async (session) => {
      await registry.update(session.tabId, (s) => ({ ...s, pendingUploads: size }));
      await maybeFinalize(session.tabId);
      await publish(session.tabId);
    }),
  );
}

const onSizeChange = (meetingId: string): void => {
  syncPending(meetingId).catch(logTo(logger, 'Could not update the upload count', 'error'));
};

const queueOptions = {
  maxAttempts: 6,
  backoff: { baseMs: 2000, maxMs: 60_000 },
  schedule: scheduleRetry,
  onSizeChange,
  onError: logTo(logger, 'The upload queue stopped', 'error'),
};

const audioQueue = createUploadQueue<AudioChunk>({
  ...queueOptions,
  upload: uploadAudio,
  capacity: CAPACITY,
  highWater: HIGH_WATER,
  onUploaded: (chunk, outcome) => addLiveSegments(chunk.meetingId, outcome.segments),
  onFailed: (chunk, reason) => {
    logger.warn('Audio upload failed', undefined, { reason, stream: chunk.stream });
    failCapture(chunk.meetingId, uploadFailureMessage(reason)).catch(
      logTo(logger, 'Could not stop capture after a failed upload', 'error'),
    );
  },
});

/** A lost screen piece leaves a gap in the video; transcription carries on regardless. */
const videoQueue = createUploadQueue<VideoPiece>({
  ...queueOptions,
  upload: uploadVideo,
  capacity: VIDEO_CAPACITY,
  highWater: VIDEO_HIGH_WATER,
  onUploaded: () => undefined,
  onFailed: (piece, reason) => {
    logger.warn('Screen recording upload failed', undefined, { reason, seq: piece.seq });
    noteOn(piece.tabId, 'Part of the screen recording could not be saved').catch(
      logTo(logger, 'Could not show the screen recording failure', 'error'),
    );
  },
});

async function noteOn(tabId: number, message: string): Promise<void> {
  await registry.update(tabId, (s) => ({ ...s, captureError: message }));
  await publish(tabId);
}

/** The consented tab of the meeting that owns uploads; null drops the data. */
async function ownerOf(meetingId: string): Promise<TabSession | null> {
  const owner = (await sessionsOf(meetingId)).find((s) => s.consentRecorded);
  if (owner === undefined) {
    logger.warn('Dropped recording data for a meeting without consent on record');
    return null;
  }
  return owner;
}

/** A refused chunk, or a queue past its high-water mark, pauses capture until it catches up. */
async function settle(owner: TabSession, result: EnqueueResult): Promise<void> {
  if (!result.accepted && result.reason === 'duplicate') {
    // Already queued or sent: the same piece handed over twice changes nothing.
    return;
  }
  if (!result.accepted) {
    logger.warn('A chunk was refused by the upload queue', undefined, { reason: result.reason });
  }
  if (!result.accepted || result.backpressure) {
    await pauseCapture(owner.tabId, uploadFailureMessage('backpressure'));
  }
}

/** One transcription chunk from the recorder: numbered per meeting and stream, then queued. */
export async function handleAudio(chunk: RecordedAudio): Promise<void> {
  const owner = await ownerOf(chunk.meetingId);
  if (owner === null) {
    return;
  }
  const seq = await registry.takeSeq(chunk.meetingId, chunk.stream);
  await settle(owner, audioQueue.enqueue({ ...chunk, tabId: owner.tabId, seq }));
}

/** One screen-recording piece from the recorder, queued in order. */
export async function handleVideo(piece: RecordedVideo): Promise<void> {
  const owner = await ownerOf(piece.meetingId);
  if (owner === null) {
    return;
  }
  const stream = `SCREEN-${piece.part}` as const;
  await settle(owner, videoQueue.enqueue({ ...piece, tabId: owner.tabId, stream }));
}

/** True while uploads are too far behind to resume capture. */
export function uploadsBehind(): boolean {
  return audioQueue.size() >= HIGH_WATER || videoQueue.size() >= VIDEO_HIGH_WATER;
}
