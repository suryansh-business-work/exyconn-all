import type { DayDetail, DayScreenshot } from '@shared/types';

/** The slice of the portal's `myTrackerDay` payload the app actually asks for. */
export interface RawDay {
  intervals: ReadonlyArray<{
    activeMs: number;
    idleMs: number;
    keyCount: number;
    mouseCount: number;
  }>;
  screenshots: readonly DayScreenshot[];
  sessions: ReadonlyArray<{ id: string }>;
}

/**
 * Folds one day's intervals into the totals the report shows, alongside that day's
 * screenshots. Pure, so the arithmetic is unit-tested without a portal or Electron.
 */
export function summarizeDay(day: RawDay): DayDetail {
  let activeMs = 0;
  let idleMs = 0;
  let keyCount = 0;
  let mouseCount = 0;

  for (const interval of day.intervals) {
    activeMs += interval.activeMs;
    idleMs += interval.idleMs;
    keyCount += interval.keyCount;
    mouseCount += interval.mouseCount;
  }

  return {
    activeMs,
    idleMs,
    keyCount,
    mouseCount,
    sessions: day.sessions.length,
    screenshots: [...day.screenshots],
  };
}
