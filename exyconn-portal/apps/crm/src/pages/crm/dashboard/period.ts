import {
  addDays,
  addMonths,
  addQuarters,
  addYears,
  format,
  isValid,
  parseISO,
  startOfMonth,
  startOfQuarter,
  startOfYear,
} from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

/** The periods the overview offers; `custom` reads its days from the address. */
export const PERIODS = ['month', 'quarter', 'year', 'custom'] as const;
export type PeriodKind = (typeof PERIODS)[number];

const PERIOD_SET: ReadonlySet<string> = new Set(PERIODS);
const DAY = 'yyyy-MM-dd';

/** What the address says about the period: `?period=custom&from=2026-01-01&to=2026-03-31`. */
export interface PeriodParams {
  kind: PeriodKind;
  /** Inclusive calendar days, only for a custom period. */
  fromDay: string;
  toDay: string;
}

/** The period from search params; anything unknown or half-set falls back to this month. */
export function readPeriod(params: URLSearchParams): PeriodParams {
  const raw = params.get('period') ?? 'month';
  const kind = PERIOD_SET.has(raw) ? (raw as PeriodKind) : 'month';
  return { kind, fromDay: params.get('from') ?? '', toDay: params.get('to') ?? '' };
}

/** A `yyyy-MM-dd` day as a Date for a picker, or null when it is not a real day. */
export function dayValue(day: string): Date | null {
  if (!day) {
    return null;
  }
  const parsed = parseISO(day);
  return isValid(parsed) ? parsed : null;
}

/** A picker's Date as the day the address stores. */
export const dayKey = (date: Date): string => format(date, DAY);

/** Midnight at the start of a calendar day in the company's zone, as an instant. */
const midnight = (day: Date, timezone: string): Date =>
  fromZonedTime(`${format(day, DAY)}T00:00:00`, timezone);

/**
 * The instants the server is asked for: from (inclusive) to (exclusive). "This month" is the
 * company's month, in the admin-configured zone, not the browser's. A custom range runs to the
 * end of its last day; null until both days are set and in order.
 */
export function periodRange(
  period: PeriodParams,
  now: Date,
  timezone: string,
): { from: Date; to: Date } | null {
  const today = toZonedTime(now, timezone);
  if (period.kind === 'custom') {
    const from = dayValue(period.fromDay);
    const to = dayValue(period.toDay);
    if (!from || !to || to < from) {
      return null;
    }
    return { from: midnight(from, timezone), to: midnight(addDays(to, 1), timezone) };
  }
  const starts = {
    month: [startOfMonth(today), addMonths(startOfMonth(today), 1)],
    quarter: [startOfQuarter(today), addQuarters(startOfQuarter(today), 1)],
    year: [startOfYear(today), addYears(startOfYear(today), 1)],
  } as const;
  const [start, end] = starts[period.kind];
  return { from: midnight(start, timezone), to: midnight(end, timezone) };
}
