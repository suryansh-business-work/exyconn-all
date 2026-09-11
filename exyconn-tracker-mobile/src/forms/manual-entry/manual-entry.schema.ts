import { z } from 'zod';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/**
 * The portal's bounds on one claim (TRACKER_MANUAL_LIMITS), so the form says no before the
 * round trip does — in the portal's own words, which is what it would have said anyway.
 */
export const MANUAL_ENTRY_LIMITS = Object.freeze({
  /** Shortest entry worth a review. */
  minDurationMs: MINUTE_MS,
  /** A day of off-computer work is a day; more is a data-entry slip. */
  maxDurationMs: 16 * HOUR_MS,
  /** How far back an entry may be claimed, so last quarter cannot be re-opened. */
  maxBackdateMs: 90 * DAY_MS,
});

/** The first thing wrong with the window as a whole, in the order the portal checks it. */
function windowProblem(startMs: number, endMs: number, now: number): string | null {
  const durationMs = endMs - startMs;
  if (durationMs <= 0) {
    return 'The entry must end after it starts.';
  }
  if (durationMs < MANUAL_ENTRY_LIMITS.minDurationMs) {
    return 'An entry must cover at least a minute.';
  }
  if (durationMs > MANUAL_ENTRY_LIMITS.maxDurationMs) {
    return 'One entry cannot cover more than 16 hours. Split it across days.';
  }
  if (endMs > now) {
    return 'Off-computer time cannot be claimed before it has been worked.';
  }
  return null;
}

/**
 * A claim for work done away from the phone — a client meeting, a site visit, a call.
 *
 * The window and the note are the whole point: a reviewer decides on hours nobody measured,
 * and can only do that if they can see when the work happened and what it was. The project
 * may be empty (the portal books that to its house-wide Global Project), and so may the
 * ticket (booked to the project alone).
 */
export const manualEntrySchema = z
  .object({
    projectId: z.string(),
    taskId: z.string(),
    startedAt: z.string().min(1, 'When did the work start?'),
    endedAt: z.string().min(1, 'When did it end?'),
    note: z.string().trim().min(1, 'Say what the time was for.'),
  })
  .superRefine((values, ctx) => {
    const startMs = Date.parse(values.startedAt);
    const endMs = Date.parse(values.endedAt);
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
      return;
    }
    const now = Date.now();
    const problem = windowProblem(startMs, endMs, now);
    if (problem !== null) {
      ctx.addIssue({ code: 'custom', path: ['endedAt'], message: problem });
    }
    if (now - startMs > MANUAL_ENTRY_LIMITS.maxBackdateMs) {
      ctx.addIssue({
        code: 'custom',
        path: ['startedAt'],
        message: 'Entries can only be claimed within 90 days of the work.',
      });
    }
  });
