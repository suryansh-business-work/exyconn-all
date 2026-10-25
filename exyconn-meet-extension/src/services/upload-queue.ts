import { backoffDelay, type BackoffOptions } from '../utils/backoff';
import type { UploadOutcome } from './audio-upload';

/** What the queue needs of a chunk: its identity on the server. */
export interface QueuedChunk {
  meetingId: string;
  stream: string;
  seq: number;
}

export interface UploadQueueOptions<T extends QueuedChunk> {
  upload: (chunk: T) => Promise<UploadOutcome>;
  /** Hard limit on queued chunks; a chunk past it is refused. */
  capacity: number;
  /** At this many queued chunks the producer is told to pause. */
  highWater: number;
  maxAttempts: number;
  backoff: BackoffOptions;
  schedule: (run: () => void, delayMs: number) => void;
  onUploaded: (chunk: T, outcome: Extract<UploadOutcome, { kind: 'done' }>) => void;
  /** A chunk that can never be uploaded (or ran out of attempts). */
  onFailed: (chunk: T, reason: string) => void;
  /** Called after every change in the number of chunks waiting. */
  onSizeChange: (meetingId: string, size: number) => void;
  /** A callback above threw; the queue stops until the next enqueue restarts it. */
  onError: (error: unknown) => void;
}

export type EnqueueResult =
  { accepted: true; backpressure: boolean } | { accepted: false; reason: 'duplicate' | 'full' };

interface Entry<T> {
  chunk: T;
  attempts: number;
}

/** A chunk's identity on the server: one meeting, one stream, one sequence number. */
export function chunkKey(chunk: QueuedChunk): string {
  return `${chunk.meetingId}:${chunk.stream}:${chunk.seq}`;
}

/**
 * Uploads chunks one at a time, in order, with exponential backoff between retries.
 *
 * Nothing is ever dropped to make room: when the queue reaches `highWater` the caller is
 * told (backpressure) and must pause capture, and the queue refuses chunks only past
 * `capacity`. A chunk is never uploaded twice — the key is remembered once accepted.
 */
export function createUploadQueue<T extends QueuedChunk>(options: UploadQueueOptions<T>) {
  const entries: Array<Entry<T>> = [];
  const seen = new Set<string>();
  let running = false;

  const countFor = (meetingId: string): number =>
    entries.filter((entry) => entry.chunk.meetingId === meetingId).length;

  function finish(entry: Entry<T>): void {
    entries.shift();
    options.onSizeChange(entry.chunk.meetingId, countFor(entry.chunk.meetingId));
  }

  async function step(): Promise<void> {
    const entry = entries[0];
    if (entry === undefined) {
      running = false;
      return;
    }
    entry.attempts += 1;
    const outcome = await options.upload(entry.chunk);
    if (outcome.kind === 'done') {
      finish(entry);
      options.onUploaded(entry.chunk, outcome);
      return step();
    }
    if (outcome.kind === 'fatal' || entry.attempts >= options.maxAttempts) {
      finish(entry);
      const reason = outcome.kind === 'fatal' ? outcome.reason : 'max_attempts';
      options.onFailed(entry.chunk, reason);
      return step();
    }
    const delay = backoffDelay(entry.attempts, options.backoff, outcome.retryAfterMs);
    options.schedule(run, delay);
  }

  function run(): void {
    step().catch((error: unknown) => {
      running = false;
      options.onError(error);
    });
  }

  function kick(): void {
    if (running) {
      return;
    }
    running = true;
    run();
  }

  return {
    enqueue(chunk: T): EnqueueResult {
      const key = chunkKey(chunk);
      if (seen.has(key)) {
        return { accepted: false, reason: 'duplicate' };
      }
      if (entries.length >= options.capacity) {
        return { accepted: false, reason: 'full' };
      }
      seen.add(key);
      entries.push({ chunk, attempts: 0 });
      options.onSizeChange(chunk.meetingId, countFor(chunk.meetingId));
      kick();
      return { accepted: true, backpressure: entries.length >= options.highWater };
    },
    size: (): number => entries.length,
    sizeFor: countFor,
  };
}

export type UploadQueue = ReturnType<typeof createUploadQueue>;
