import { createLimiter } from '../../lib/rateLimiter';

/**
 * Abuse guard for the problem-report mutations anybody on the internet can call: ten per hour
 * per client (the caller's IP), counted in the shared store so a restart or a second instance
 * does not reset it. An unknown client (no address on the request) shares a single bucket
 * rather than bypassing.
 */
const WINDOW_SEC = 60 * 60;
const MAX_PER_WINDOW = 10;

export const reportLimiter = createLimiter({
  keyPrefix: 'status_report',
  points: MAX_PER_WINDOW,
  durationSec: WINDOW_SEC,
});

/** Records one attempt from `client` and reports whether it is allowed. */
export function allowReportAttempt(client: string): Promise<boolean> {
  return reportLimiter.allow(client);
}

const recent = new Map<string, number[]>();

/**
 * @deprecated In-memory and per-process — use `await allowReportAttempt(client)`. Kept only
 * until problem-report.service.ts and problem-report.notify.ts switch over; an un-awaited
 * promise in their `if (!allowReport(...))` would silently stop limiting, so this stays sync.
 */
export function allowReport(client: string): boolean {
  const now = Date.now();
  const times = (recent.get(client) ?? []).filter((time) => now - time < WINDOW_SEC * 1000);
  if (times.length >= MAX_PER_WINDOW) {
    recent.set(client, times);
    return false;
  }
  times.push(now);
  recent.set(client, times);
  return true;
}

/** Test seam: forgets every recorded attempt. */
export async function resetReportLimits(): Promise<void> {
  recent.clear();
  await reportLimiter.reset();
}
