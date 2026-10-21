import type { Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { Types } from 'mongoose';
import { gridFsBucket } from './recording.store';

/**
 * Extension build ZIPs, in a GridFS bucket beside the saved call audio (the stack has no object
 * store). Install-wide like the releases themselves, so nothing here is company-scoped.
 */
const BUCKET = 'ma_extension_releases';

/** Stores one build's ZIP and returns its file id. */
export async function saveReleaseZip(
  name: string,
  zip: Buffer,
  metadata: { version: string; sha256: string },
): Promise<Types.ObjectId> {
  const upload = gridFsBucket(BUCKET).openUploadStream(name, {
    metadata: { ...metadata, contentType: 'application/zip' },
  });
  await new Promise<void>((resolve, reject) => {
    upload.once('finish', () => resolve());
    upload.once('error', reject);
    upload.end(zip);
  });
  return upload.id;
}

/** Removes a stored ZIP whose release could not be registered. */
export async function deleteReleaseZip(fileId: Types.ObjectId): Promise<void> {
  await gridFsBucket(BUCKET).delete(fileId);
}

/**
 * Streams a stored ZIP into `out` (the download response). A missing file is refused before
 * anything is piped: a stream failing mid-pipe would destroy the response instead of letting
 * the caller answer with an error.
 */
export async function streamReleaseZip(fileId: Types.ObjectId, out: Writable): Promise<void> {
  const bucket = gridFsBucket(BUCKET);
  if (!(await bucket.find({ _id: fileId }).hasNext())) {
    throw new Error(`The release ZIP ${fileId.toHexString()} is missing from the store.`);
  }
  await pipeline(bucket.openDownloadStream(fileId), out);
}
