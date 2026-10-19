import { dayBounds, monthBounds, todayKeyIn } from '@exyconn/tracker-core';
import type { TrackerEarnings } from '@shared/types';
import usePortalRead, { type PortalRead } from './usePortalRead';

export interface EarningsQuery {
  today: PortalRead<TrackerEarnings>;
  month: PortalRead<TrackerEarnings>;
}

/**
 * Today's and this month's earnings, in the employee's own zone. Re-read when a sync lands —
 * the only moment tracked time, and so the amount, can have moved (as the all-time totals do).
 */
export default function useEarnings(timezone: string, lastSyncAt: string | null): EarningsQuery {
  // Today as the employee's zone sees it, not this computer's — they differ near midnight.
  const [year, monthIndex, date] = todayKeyIn(timezone).split('-').map(Number);
  const day = dayBounds(new Date(year, monthIndex - 1, date), timezone);
  const month = monthBounds(new Date(year, monthIndex - 1, 1), timezone);
  const key = `${timezone}|${lastSyncAt ?? ''}`;

  return {
    today: usePortalRead(
      () => globalThis.tracker.getEarnings(day.startISO, day.endISO),
      `${day.startISO}|${key}`,
      'today’s earnings',
    ),
    month: usePortalRead(
      () => globalThis.tracker.getEarnings(month.fromISO, month.toISO),
      `${month.fromISO}|${key}`,
      'this month’s earnings',
    ),
  };
}
