import { MaJobModel } from './models';
import type { MaJobKind } from './ma.enums';

export interface EnqueueOptions {
  /** Distinguishes runs of the same step: a regenerate or a new notes version. */
  round?: number | string;
  delayMs?: number;
  maxAttempts?: number;
  requestedBy?: { id: string; name: string } | null;
  style?: string | null;
}

/** The idempotency key of one step of one meeting. */
export const jobKey = (kind: MaJobKind, meetingId: string, round: number | string = 0) =>
  `${kind.toLowerCase()}:${meetingId}:${round}`;

/**
 * Queues a pipeline step once. Queuing the same key again finds the existing row and changes
 * nothing, so a retried finalize or a double click never runs a step twice.
 */
export async function enqueueMaJob(
  kind: MaJobKind,
  meetingId: string,
  options: EnqueueOptions = {},
): Promise<void> {
  const key = jobKey(kind, meetingId, options.round);
  await MaJobModel.updateOne(
    { key },
    {
      $setOnInsert: {
        key,
        kind,
        meetingId,
        status: 'QUEUED',
        runAfter: new Date(Date.now() + (options.delayMs ?? 0)),
        maxAttempts: options.maxAttempts ?? 3,
        requestedById: options.requestedBy?.id ?? null,
        requestedByName: options.requestedBy?.name ?? '',
        style: options.style ?? null,
      },
    },
    { upsert: true },
  );
}

/** Drops steps nobody has started yet: a call that resumed is not over after all. */
export async function cancelQueuedJobs(meetingId: string): Promise<void> {
  await MaJobModel.deleteMany({ meetingId, status: 'QUEUED' });
}
