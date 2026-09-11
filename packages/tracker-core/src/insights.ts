import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { activityPercent } from './format';
import { dayBounds } from './time';
import type { DayInterval, ReportDay } from './types';

/**
 * The shapes behind the trackers' insight charts — the day's activity stripes, a period's
 * columns, and this period against the one before. Pure and colourless, so both apps draw the
 * same numbers and the arithmetic is unit-tested once. Every figure is the portal's own; a day
 * the employee did not work is drawn as nothing, never as an invented value.
 */

export type ActivityLevel = 'low' | 'medium' | 'high';

/** Where a level starts, in percent. `high` is the 70% the screenshot chips turn green at. */
export const ACTIVITY_THRESHOLDS = { medium: 40, high: 70 } as const;

/** The legend under every activity chart, worded from the thresholds so it cannot drift. */
export const ACTIVITY_LEGEND: ReadonlyArray<{ level: ActivityLevel; label: string }> = [
  { level: 'low', label: `<${ACTIVITY_THRESHOLDS.medium}%` },
  { level: 'medium', label: `${ACTIVITY_THRESHOLDS.medium}–${ACTIVITY_THRESHOLDS.high - 1}%` },
  { level: 'high', label: `≥${ACTIVITY_THRESHOLDS.high}%` },
];

export function activityLevel(percent: number): ActivityLevel {
  if (percent >= ACTIVITY_THRESHOLDS.high) {
    return 'high';
  }
  return percent >= ACTIVITY_THRESHOLDS.medium ? 'medium' : 'low';
}

/**
 * One bar of a stripes chart, in unit space: both charts (the day's intervals and a period's
 * days) hand the apps this shape, so each app draws them with one component.
 */
export interface ChartBar {
  key: string;
  /** 0–1 along the x axis. */
  offset: number;
  /** 0–1 of the x axis. */
  width: number;
  /** 0–1 of the chart's height. */
  value: number;
  /** Null for an empty slot — a day with nothing tracked. */
  level: ActivityLevel | null;
}

/** One interval of the day, placed on the span from the first start to the last end. */
export interface ActivityStripe extends ChartBar {
  percent: number;
  level: ActivityLevel;
}

export interface DayStripes {
  stripes: ActivityStripe[];
  /** The span's bounds and midpoint, for the axis labels. Null on a day with no intervals. */
  span: { startISO: string; midISO: string; endISO: string } | null;
  /** Active share of everything the intervals recorded. */
  averagePercent: number;
}

/** The day's synced intervals as stripes, positioned by time so a break shows as a gap. */
export function dayStripes(intervals: readonly DayInterval[]): DayStripes {
  if (intervals.length === 0) {
    return { stripes: [], span: null, averagePercent: 0 };
  }
  const start = Date.parse(intervals[0].startedAt);
  const end = Math.max(...intervals.map((interval) => Date.parse(interval.endedAt)));
  const length = Math.max(end - start, 1);
  let activeMs = 0;
  let idleMs = 0;
  const stripes = intervals.map((interval) => {
    activeMs += interval.activeMs;
    idleMs += interval.idleMs;
    const from = Date.parse(interval.startedAt);
    return {
      key: interval.startedAt,
      offset: (from - start) / length,
      width: Math.max(Date.parse(interval.endedAt) - from, 0) / length,
      value: interval.activityPercent / 100,
      percent: interval.activityPercent,
      level: activityLevel(interval.activityPercent),
    };
  });
  return {
    stripes,
    span: {
      startISO: new Date(start).toISOString(),
      midISO: new Date(start + length / 2).toISOString(),
      endISO: new Date(end).toISOString(),
    },
    averagePercent: activityPercent(activeMs, idleMs),
  };
}

/** How many days back the insights look. */
export type PeriodLength = 7 | 30;

/** The period ending today and the equally long one before it, as calendar-day keys. */
export interface PeriodWindow {
  current: string[];
  previous: string[];
  /** One query covers both periods: the first previous day's start to today's end. */
  fromISO: string;
  toISO: string;
}

/** Today's calendar date in the employee's zone, as a local Date at midnight. */
export function zonedToday(zone: string, now: Date = new Date()): Date {
  const [year, month, day] = formatInTimeZone(now, zone, 'yyyy-MM-dd').split('-');
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function shiftDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function periodWindow(today: Date, length: PeriodLength, zone: string): PeriodWindow {
  const keys = Array.from({ length: length * 2 }, (_unused, index) =>
    format(shiftDays(today, index - length * 2 + 1), 'yyyy-MM-dd'),
  );
  return {
    previous: keys.slice(0, length),
    current: keys.slice(length),
    fromISO: dayBounds(shiftDays(today, 1 - length * 2), zone).startISO,
    toISO: dayBounds(today, zone).endISO,
  };
}

export interface PeriodTotals {
  activeMs: number;
  idleMs: number;
  keyCount: number;
  mouseCount: number;
  sessions: number;
  /** Days with any tracked time. */
  trackedDays: number;
  activityPercent: number;
}

/** Sums the report days whose keys are in `keys`. */
export function periodTotals(days: readonly ReportDay[], keys: readonly string[]): PeriodTotals {
  const wanted = new Set(keys);
  const totals = { activeMs: 0, idleMs: 0, keyCount: 0, mouseCount: 0, sessions: 0 };
  let trackedDays = 0;
  for (const day of days) {
    if (!wanted.has(day.date.slice(0, 10))) {
      continue;
    }
    totals.activeMs += day.activeMs;
    totals.idleMs += day.idleMs;
    totals.keyCount += day.keyCount;
    totals.mouseCount += day.mouseCount;
    totals.sessions += day.sessions;
    if (day.activeMs + day.idleMs > 0) {
      trackedDays += 1;
    }
  }
  return {
    ...totals,
    trackedDays,
    activityPercent: activityPercent(totals.activeMs, totals.idleMs),
  };
}

/** Percent change from `previous`, one decimal. Null when there is nothing to compare to. */
export function changePercent(current: number, previous: number): number | null {
  if (previous <= 0) {
    return null;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export type ChangeDirection = 'up' | 'down' | 'flat';

/** A change as the badge beside a figure says it: "+12%", or "+3 pts" for a percentage. */
export interface ChangeLabel {
  text: string;
  direction: ChangeDirection;
}

function directionOf(delta: number): ChangeDirection {
  if (delta > 0) {
    return 'up';
  }
  return delta < 0 ? 'down' : 'flat';
}

function signed(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

/** Relative change of a count or duration. Null when the earlier period had none to compare. */
export function relativeChange(current: number, previous: number): ChangeLabel | null {
  const change = changePercent(current, previous);
  return change === null ? null : { text: `${signed(change)}%`, direction: directionOf(change) };
}

/** Change of a percentage, in points — "+3 pts" — since a percent of a percent misleads. */
export function pointChange(current: number, previous: number): ChangeLabel {
  const delta = current - previous;
  return { text: `${signed(delta)} pts`, direction: directionOf(delta) };
}

/** One day of a period, as a column: its worked time against the period's longest day. */
export interface PeriodColumn extends ChartBar {
  /** The day key, `yyyy-MM-dd` — also the bar's key. */
  date: string;
  activeMs: number;
  percent: number;
}

export function periodColumns(days: readonly ReportDay[], keys: readonly string[]): PeriodColumn[] {
  const byDate = new Map(days.map((day) => [day.date.slice(0, 10), day]));
  const longest = Math.max(1, ...keys.map((key) => byDate.get(key)?.activeMs ?? 0));
  return keys.map((date, index) => {
    const day = byDate.get(date);
    const activeMs = day?.activeMs ?? 0;
    const percent = day === undefined ? 0 : activityPercent(day.activeMs, day.idleMs);
    const tracked = day !== undefined && day.activeMs + day.idleMs > 0;
    return {
      key: date,
      date,
      offset: index / keys.length,
      width: 1 / keys.length,
      value: activeMs / longest,
      activeMs,
      percent,
      level: tracked ? activityLevel(percent) : null,
    };
  });
}
