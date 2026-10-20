import { isRecord } from '../storage/area';
import type { AudioStream, LiveSegment } from '../types/meeting';
import { base64DecodedLength } from '../utils/base64';
import { ApiError, fetchWithTimeout, readJson, type FetchLike } from './http';

/** The server's hard limit per chunk, on the decoded WAV. */
export const MAX_CHUNK_BYTES = 8 * 1024 * 1024;
/** Uploading 25 s of audio can take a while on a poor connection. */
const UPLOAD_TIMEOUT_MS = 60_000;

export interface AudioChunk {
  meetingId: string;
  tabId: number;
  stream: AudioStream;
  seq: number;
  startMs: number;
  durationMs: number;
  /** A 16 kHz mono PCM16 WAV file, base64-encoded. */
  audio: string;
}

export type UploadOutcome =
  | { kind: 'done'; duplicate: boolean; segments: LiveSegment[] }
  | { kind: 'retry'; reason: string; retryAfterMs: number }
  | { kind: 'fatal'; reason: string };

export interface AudioUploaderOptions {
  apiUrl: string;
  fetchImpl: FetchLike;
  getAccessToken: () => Promise<string | null>;
  refreshAccessToken: () => Promise<string | null>;
}

function toSegment(raw: unknown): LiveSegment | null {
  if (
    !isRecord(raw) ||
    typeof raw.id !== 'string' ||
    typeof raw.text !== 'string' ||
    typeof raw.startMs !== 'number' ||
    typeof raw.endMs !== 'number'
  ) {
    return null;
  }
  const speakerLabel = typeof raw.speakerLabel === 'string' ? raw.speakerLabel : null;
  return { id: raw.id, startMs: raw.startMs, endMs: raw.endMs, text: raw.text, speakerLabel };
}

function errorCode(body: unknown, fallback: string): string {
  return isRecord(body) && typeof body.error === 'string' ? body.error : fallback;
}

function retryAfter(body: unknown): number {
  return isRecord(body) && typeof body.retryAfterMs === 'number' ? body.retryAfterMs : 0;
}

/** Maps one HTTP answer onto what the queue must do next. */
export function classifyUploadResponse(status: number, body: unknown): UploadOutcome {
  if (status === 200) {
    const rawSegments = isRecord(body) && Array.isArray(body.segments) ? body.segments : [];
    const segments = rawSegments.map(toSegment).filter((s): s is LiveSegment => s !== null);
    return { kind: 'done', duplicate: isRecord(body) && body.status === 'DUPLICATE', segments };
  }
  if (status === 429) {
    return {
      kind: 'retry',
      reason: errorCode(body, 'rate_limited'),
      retryAfterMs: retryAfter(body),
    };
  }
  if (status === 413) {
    return { kind: 'fatal', reason: 'too_large' };
  }
  if (status >= 500) {
    return { kind: 'retry', reason: errorCode(body, 'server_error'), retryAfterMs: 0 };
  }
  return { kind: 'fatal', reason: errorCode(body, `http_${status}`) };
}

/**
 * Uploads one chunk of 16 kHz mono PCM16 WAV audio as JSON (the server saves it, per the
 * company's retention, and transcribes it). A 401 refreshes the token once; a network failure
 * or timeout is retryable. The chunk's identity (meeting, stream, seq) makes a retry
 * idempotent on the server, which answers DUPLICATE for a chunk it already has.
 */
export function createAudioUploader(options: AudioUploaderOptions) {
  async function send(
    chunk: AudioChunk,
    token: string,
  ): Promise<{ status: number; body: unknown }> {
    const response = await fetchWithTimeout(
      options.fetchImpl,
      `${options.apiUrl}/meet-assistant/audio`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId: chunk.meetingId,
          stream: chunk.stream,
          seq: chunk.seq,
          startMs: Math.max(0, Math.round(chunk.startMs)),
          durationMs: Math.round(chunk.durationMs),
          audio: chunk.audio,
        }),
      },
      UPLOAD_TIMEOUT_MS,
    );
    return { status: response.status, body: await readJson(response) };
  }

  return async function upload(chunk: AudioChunk): Promise<UploadOutcome> {
    if (base64DecodedLength(chunk.audio) > MAX_CHUNK_BYTES) {
      return { kind: 'fatal', reason: 'too_large' };
    }
    try {
      const token = await options.getAccessToken();
      if (token === null) {
        return { kind: 'fatal', reason: 'signed_out' };
      }
      let result = await send(chunk, token);
      if (result.status === 401) {
        const fresh = await options.refreshAccessToken();
        if (fresh === null) {
          return { kind: 'fatal', reason: 'signed_out' };
        }
        result = await send(chunk, fresh);
      }
      if (result.status === 401) {
        return { kind: 'fatal', reason: 'signed_out' };
      }
      return classifyUploadResponse(result.status, result.body);
    } catch (error) {
      const reason = error instanceof ApiError ? error.code : 'network';
      return { kind: 'retry', reason, retryAfterMs: 0 };
    }
  };
}
