import mongoose from 'mongoose';
import type { Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { buffer } from 'node:stream/consumers';
import { currentOrganizationId } from '../../lib/tenant';
import { forbidden } from '../../utils/errors';
import { WAV_HEADER_BYTES, wavHeader } from './wav';

/**
 * Saved call audio, one 16 kHz PCM WAV file per uploaded chunk, in a GridFS bucket on the
 * database the API already has (the stack has no object store). GridFS is the raw driver, so
 * the tenant plugin does not see it: EVERY read and write here is filtered by the company in
 * scope explicitly, through `scoped()`.
 */
const BUCKET = 'ma_recordings';

export interface RecordingChunkRef {
  meetingId: string;
  stream: string;
  seq: number;
}

interface FileDoc {
  _id: mongoose.Types.ObjectId;
  length: number;
  metadata: { seq: number; durationMs: number };
}

const bucket = () => {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('The database is not connected.');
  }
  return new mongoose.mongo.GridFSBucket(db, { bucketName: BUCKET });
};

/** The company in scope; refusing a platform scope, which owns no recordings. */
function organization(): string {
  const organizationId = currentOrganizationId();
  if (!organizationId) {
    forbidden('Recordings belong to a company.');
  }
  return organizationId;
}

const scoped = (filter: Record<string, unknown>) => ({
  'metadata.organizationId': organization(),
  ...filter,
});

const fileName = (ref: RecordingChunkRef) => `${ref.meetingId}/${ref.stream}/${ref.seq}.wav`;

async function findFiles(filter: Record<string, unknown>): Promise<FileDoc[]> {
  return (await bucket()
    .find(scoped(filter))
    .sort({ 'metadata.seq': 1 })
    .toArray()) as unknown as FileDoc[];
}

/** Saves one chunk. Saving the same chunk again replaces it, so a retried upload is harmless. */
export async function saveChunk(
  ref: RecordingChunkRef,
  wav: Buffer,
  durationMs: number,
): Promise<void> {
  const organizationId = organization();
  const previous = await findFiles({
    'metadata.meetingId': ref.meetingId,
    'metadata.stream': ref.stream,
    'metadata.seq': ref.seq,
  });
  await Promise.all(previous.map((file) => bucket().delete(file._id)));
  const upload = bucket().openUploadStream(fileName(ref), {
    metadata: { organizationId, ...ref, durationMs },
  });
  await new Promise<void>((resolve, reject) => {
    upload.once('finish', () => resolve());
    upload.once('error', reject);
    upload.end(wav);
  });
}

export interface RecordingTrack {
  stream: string;
  chunkCount: number;
  seconds: number;
  sizeBytes: number;
}

/** What is saved for a meeting, per stream. */
export async function recordingTracks(meetingId: string): Promise<RecordingTrack[]> {
  const files = await findFiles({ 'metadata.meetingId': meetingId });
  const tracks = new Map<string, RecordingTrack>();
  for (const file of files) {
    const stream = (file.metadata as unknown as { stream: string }).stream;
    const track = tracks.get(stream) ?? { stream, chunkCount: 0, seconds: 0, sizeBytes: 0 };
    track.chunkCount += 1;
    track.seconds += Math.round(file.metadata.durationMs / 1000);
    track.sizeBytes += file.length;
    tracks.set(stream, track);
  }
  return [...tracks.values()].slice().sort((a, b) => a.stream.localeCompare(b.stream));
}

/** One saved chunk as a base64 string of its WAV file, or null when there is none. */
export async function chunkBase64(ref: RecordingChunkRef): Promise<string | null> {
  const [file] = await findFiles({
    'metadata.meetingId': ref.meetingId,
    'metadata.stream': ref.stream,
    'metadata.seq': ref.seq,
  });
  if (!file) {
    return null;
  }
  return (await buffer(bucket().openDownloadStream(file._id))).toString('base64');
}

/**
 * Streams one stream of a meeting as ONE WAV file: a header sized for every chunk, then each
 * chunk's samples in order (each file's own 44-byte header skipped). Returns false when
 * nothing is saved.
 */
export async function streamMergedWav(
  meetingId: string,
  stream: string,
  out: Writable,
): Promise<boolean> {
  const files = await findFiles({ 'metadata.meetingId': meetingId, 'metadata.stream': stream });
  if (files.length === 0) {
    return false;
  }
  const dataBytes = files.reduce(
    (sum, file) => sum + Math.max(0, file.length - WAV_HEADER_BYTES),
    0,
  );
  out.write(wavHeader(dataBytes));
  // Strictly in order: each chunk's samples must follow the previous chunk's in the one file.
  await files.reduce(
    (written, file) =>
      written.then(() => {
        // The driver reads a missing `end` as 0 and refuses any `start` past it, so both are given.
        const range = { start: WAV_HEADER_BYTES, end: file.length };
        return pipeline(bucket().openDownloadStream(file._id, range), out, { end: false });
      }),
    Promise.resolve(),
  );
  out.end();
  return true;
}

/** Deletes a meeting's saved audio, or every chunk saved before `before`. Returns how many. */
export async function deleteRecordings(filter: {
  meetingId?: string;
  before?: Date;
}): Promise<number> {
  const files = await findFiles({
    ...(filter.meetingId ? { 'metadata.meetingId': filter.meetingId } : {}),
    ...(filter.before ? { uploadDate: { $lt: filter.before } } : {}),
  });
  await Promise.all(files.map((file) => bucket().delete(file._id)));
  return files.length;
}
