import { VIDEO_MIME } from '../types/meeting';
import { base64DecodedLength, base64ToBytes } from '../utils/base64';
import { createUploader, UPLOAD_TIMEOUT_MS, type AudioUploaderOptions } from './audio-upload';
import { fetchWithTimeout, readJson } from './http';

/** One queued piece of the screen recording. `stream` keys the part in the upload queue. */
export interface VideoPiece {
  meetingId: string;
  tabId: number;
  stream: `SCREEN-${number}`;
  part: number;
  seq: number;
  durationMs: number;
  /** WebM bytes, base64. */
  data: string;
}

/**
 * Sends one screen-recording piece as the raw request body; the server streams it into
 * storage while it arrives. Saving the same (meeting, part, seq) again replaces it.
 */
export function createVideoUploader(options: AudioUploaderOptions) {
  return createUploader<VideoPiece>(
    options,
    (piece) => base64DecodedLength(piece.data),
    async (piece, token) => {
      const query = new URLSearchParams({
        part: String(piece.part),
        durationMs: String(Math.max(1, Math.round(piece.durationMs))),
      });
      const response = await fetchWithTimeout(
        options.fetchImpl,
        `${options.apiUrl}/meet-assistant/video/${piece.meetingId}/${piece.seq}?${query}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': VIDEO_MIME },
          body: base64ToBytes(piece.data),
        },
        UPLOAD_TIMEOUT_MS,
      );
      return { status: response.status, body: await readJson(response) };
    },
  );
}
