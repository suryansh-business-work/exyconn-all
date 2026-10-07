import type {
  DayDetail,
  DayScreenshot,
  PeriodTotals,
  PeriodWindow,
  ReportDay,
} from '@exyconn/tracker-core';
import type { PeriodInsights } from '../../../../src/hooks/usePeriodInsights';

export const HOUR = 3_600_000;

/** One day of the month's report; the counts are fixed so only the times vary per test. */
export function reportDay(
  date: string,
  activeMs: number,
  idleMs: number,
  overrides: Partial<ReportDay> = {},
): ReportDay {
  return { date, activeMs, idleMs, keyCount: 1200, mouseCount: 30, sessions: 2, ...overrides };
}

/** A screenshot from the portal's CDN, 80% active and not blurred unless a test says so. */
export function screenshot(
  id: string,
  capturedAt: string,
  overrides: Partial<DayScreenshot> = {},
): DayScreenshot {
  return {
    id,
    capturedAt,
    imageUrl: `https://cdn.example.test/${id}.png`,
    blurred: false,
    activityPercent: 80,
    ...overrides,
  };
}

/** A worked day: six hours active, two idle, and no screenshots unless given some. */
export function dayDetail(overrides: Partial<DayDetail> = {}): DayDetail {
  return {
    activeMs: 6 * HOUR,
    idleMs: 2 * HOUR,
    keyCount: 1500,
    mouseCount: 40,
    sessions: 3,
    screenshots: [],
    intervals: [],
    ...overrides,
  };
}

export function periodTotals(overrides: Partial<PeriodTotals> = {}): PeriodTotals {
  return {
    activeMs: 6 * HOUR,
    idleMs: 2 * HOUR,
    keyCount: 4200,
    mouseCount: 900,
    sessions: 12,
    trackedDays: 5,
    activityPercent: 75,
    ...overrides,
  };
}

/** The 7 days to 17 Feb 2026 and the 7 before them, as calendar-day keys. */
export const WEEK_WINDOW: PeriodWindow = {
  previous: [
    '2026-02-04',
    '2026-02-05',
    '2026-02-06',
    '2026-02-07',
    '2026-02-08',
    '2026-02-09',
    '2026-02-10',
  ],
  current: [
    '2026-02-11',
    '2026-02-12',
    '2026-02-13',
    '2026-02-14',
    '2026-02-15',
    '2026-02-16',
    '2026-02-17',
  ],
  fromISO: '2026-02-04T00:00:00.000Z',
  toISO: '2026-02-18T00:00:00.000Z',
};

export function insights(overrides: Partial<PeriodInsights> = {}): PeriodInsights {
  return {
    range: WEEK_WINDOW,
    current: periodTotals(),
    previous: periodTotals({
      activeMs: 4 * HOUR,
      keyCount: 2100,
      mouseCount: 0,
      sessions: 12,
      trackedDays: 4,
    }),
    columns: [],
    loading: false,
    refreshing: false,
    error: null,
    reload: () => undefined,
    ...overrides,
  };
}
