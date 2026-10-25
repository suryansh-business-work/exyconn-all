import mongoose from 'mongoose';
import { Transform, type Readable, type Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { logger } from '../../utils/logger';
import { gridFsBucket, organization, scoped, type RecordingTrack } from './recording.store';

/**
 * The live screen recording: the meeting tab's video and mixed audio as WebM, uploaded in ~5 s
 * pieces. Each Start in the extension runs a new MediaRecorder, a new "part" whose first piece
 * carries its own WebM header; one part's pieces concatenated in seq order are one playable
 * file. Like recording.store, GridFS is the raw driver, so EVERY read and write here is
 * filtered by the company in scope through `scoped()`.
 */
const BUCKET = 'ma_screen';
export const MAX_SCREEN_PIECE_BYTES = 8 * 1024 * 1024;
const SCREEN = 'SCREEN';
const NUMBERED_SCREEN = /^SCREEN_(\d{1,4})$/;

export interface ScreenPieceRef {
  meetingId: string;
  part: number;
  seq: number;
}

interface ScreenFile {
  _id: mongoose.Types.ObjectId;
  length: number;
  metadata: ScreenPieceRef & { durationMs: number };
}

/** A piece larger than the cap; nothing of it is kept. */
export class ScreenPieceTooLarge extends Error {
  constructor() {
    super('too_large');
    this.name = 'ScreenPieceTooLarge';
  }
}

const bucket = () => gridFsBucket(BUCKET);

/** A part's track name: SCREEN for the first, then SCREEN_2, SCREEN_3… after each restart. */
export const screenStreamName = (part: number) => (part === 0 ? SCREEN : `SCREEN_${part + 1}`);

/** The part a track name stands for, or null when it is not a screen track. */
export function screenPartOf(stream: string): number | null {
  if (stream === SCREEN) {
    return 0;
  }
  const match = NUMBERED_SCREEN.exec(stream);
  const number = match ? Number.parseInt(match[1], 10) : 0;
  return number >= 2 ? number - 1 : null;
}

async function findPieces(filter: Record<string, unknown>): Promise<ScreenFile[]> {
  return (await bucket()
    .find(scoped(filter))
    .sort({ 'metadata.part': 1, 'metadata.seq': 1 })
    .toArray()) as unknown as ScreenFile[];
}

/** Why an upload is not kept: past the cap, or a body that broke off. */
interface Outcome {
  error: Error | null;
}

/** Passes bytes through until the cap; past it, drops the rest and records the refusal. */
function sizeCap(outcome: Outcome): Transform {
  let size = 0;
  return new Transform({
    transform(piece: Buffer, _encoding, done) {
      size += piece.length;
      if (size > MAX_SCREEN_PIECE_BYTES) {
        outcome.error ??= new ScreenPieceTooLarge();
      }
      done(null, outcome.error ? undefined : piece);
    },
  });
}

/**
 * Deletes pieces by id. Idempotent, unlike GridFSBucket.delete, so two retries removing the
 * same stale copy never fail each other. The ids come from a company-scoped lookup.
 */
async function removePieces(ids: mongoose.Types.ObjectId[]): Promise<void> {
  if (ids.length === 0) {
    return;
  }
  await mongoose.connection.collection(`${BUCKET}.chunks`).deleteMany({ files_id: { $in: ids } });
  await mongoose.connection.collection(`${BUCKET}.files`).deleteMany({ _id: { $in: ids } });
}

/** Of every copy of one piece, keeps the newest: concurrent retries never leave two or none. */
async function keepNewest(ref: ScreenPieceRef): Promise<void> {
  const copies = await bucket()
    .find(
      scoped({
        'metadata.meetingId': ref.meetingId,
        'metadata.part': ref.part,
        'metadata.seq': ref.seq,
      }),
    )
    .sort({ _id: -1 })
    .toArray();
  await removePieces(copies.slice(1).map((file) => file._id));
}

/**
 * Streams one piece straight into GridFS, never holding it in memory. Past the cap, or when
 * the body breaks off, the rest is dropped, the partial file deleted once its writes have
 * landed, and the reason thrown (ScreenPieceTooLarge for the cap). Saving the same piece
 * again replaces it, so a retried upload is harmless.
 */
export async function saveScreenPiece(
  ref: ScreenPieceRef,
  durationMs: number,
  body: Readable,
): Promise<void> {
  const organizationId = organization();
  const upload = bucket().openUploadStream(`${ref.meetingId}/screen/${ref.part}/${ref.seq}.webm`, {
    metadata: { organizationId, ...ref, durationMs },
  });
  const outcome: Outcome = { error: null };
  const cap = sizeCap(outcome);
  const cutOff = (error: Error) => {
    outcome.error ??= error;
    body.unpipe(cap);
    cap.end();
  };
  body.once('error', cutOff);
  body.once('close', () => {
    if (!body.readableEnded) {
      cutOff(new Error('The upload was cut off.'));
    }
  });
  body.pipe(cap);
  try {
    await pipeline(cap, upload);
  } catch (error) {
    await upload
      .abort()
      .catch((abortError: unknown) => logger.warn({ err: abortError }, 'Screen piece abort'));
    throw error;
  }
  if (outcome.error) {
    await removePieces([upload.id]);
    throw outcome.error;
  }
  await keepNewest(ref);
}

/** The saved screen recording of a meeting: one track per part. */
export async function screenTracks(meetingId: string): Promise<RecordingTrack[]> {
  const tracks = new Map<number, RecordingTrack & { ms: number }>();
  for (const file of await findPieces({ 'metadata.meetingId': meetingId })) {
    const { part, durationMs } = file.metadata;
    const stream = screenStreamName(part);
    const track = tracks.get(part) ?? { stream, chunkCount: 0, seconds: 0, sizeBytes: 0, ms: 0 };
    track.chunkCount += 1;
    track.ms += durationMs;
    track.sizeBytes += file.length;
    tracks.set(part, track);
  }
  return [...tracks.values()].map(({ ms, ...track }) => ({
    ...track,
    seconds: Math.round(ms / 1000),
  }));
}

/** Streams one part as ONE WebM file: its pieces in seq order. Returns false when none. */
export async function streamScreen(meetingId: string, part: number, out: Writable) {
  const files = await findPieces({ 'metadata.meetingId': meetingId, 'metadata.part': part });
  if (files.length === 0) {
    return false;
  }
  // Strictly in order: every piece continues the previous one's WebM cluster stream.
  await files.reduce(
    (written, file) =>
      written.then(() => pipeline(bucket().openDownloadStream(file._id), out, { end: false })),
    Promise.resolve(),
  );
  out.end();
  return true;
}

/** Deletes a meeting's screen recording, or every piece saved before `before`. Returns how many. */
export async function deleteScreenPieces(filter: {
  meetingId?: string;
  before?: Date;
}): Promise<number> {
  const files = await findPieces({
    ...(filter.meetingId ? { 'metadata.meetingId': filter.meetingId } : {}),
    ...(filter.before ? { uploadDate: { $lt: filter.before } } : {}),
  });
  await removePieces(files.map((file) => file._id));
  return files.length;
}
