import { formatInTimeZone } from 'date-fns-tz';
import { badRequest } from '../../../utils/errors';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
/** The widest period the dashboard reports on: three years. */
const MAX_RANGE_DAYS = 3 * 366;

export type Granularity = 'DAY' | 'WEEK' | 'MONTH';

/** One bar or point on a time chart: its key in the company's zone and the instant it starts. */
export interface Period {
  key: string;
  start: Date;
}

/** How a period is keyed — in date-fns for the list, and in MongoDB for the aggregation. */
const KEY_FORMAT: Readonly<Record<Granularity, { dateFns: string; mongo: string }>> = {
  DAY: { dateFns: 'yyyy-MM-dd', mongo: '%Y-%m-%d' },
  // ISO weeks on both sides (%G/%V and RRRR/II), so a week spanning New Year is one bar.
  WEEK: { dateFns: "RRRR-'W'II", mongo: '%G-W%V' },
  MONTH: { dateFns: 'yyyy-MM', mongo: '%Y-%m' },
};

/** The checked range: real instants, `to` after `from`, at most three years apart. */
export function dashboardWindow(from: Date | string, to: Date | string): { from: Date; to: Date } {
  const start = new Date(from);
  const end = new Date(to);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    badRequest('Choose a period that ends after it starts.');
  }
  if (end.getTime() - start.getTime() > MAX_RANGE_DAYS * DAY_MS) {
    badRequest('A dashboard period can cover at most three years.');
  }
  return { from: start, to: end };
}

/** Days for a month, weeks for up to about six months, months beyond — never a hundred bars. */
export function granularityOf(from: Date, to: Date): Granularity {
  const days = (to.getTime() - from.getTime()) / DAY_MS;
  if (days <= 35) {
    return 'DAY';
  }
  return days <= 190 ? 'WEEK' : 'MONTH';
}

/** The aggregation expression that puts a date field in its period, in the company's zone. */
export function periodKeyExpression(field: string, granularity: Granularity, timezone: string) {
  return {
    $dateToString: { date: `$${field}`, format: KEY_FORMAT[granularity].mongo, timezone },
  };
}

/**
 * Every period from `from` up to `to`, in order, so a chart shows a quiet week as zero rather
 * than leaving it out. Walked in 12-hour steps: shorter than any day, so a 23-hour day at a
 * daylight-saving change is never stepped over.
 */
export function periodsBetween(
  from: Date,
  to: Date,
  granularity: Granularity,
  timezone: string,
): Period[] {
  const periods: Period[] = [];
  const seen = new Set<string>();
  const format = KEY_FORMAT[granularity].dateFns;
  for (let at = from.getTime(); at < to.getTime(); at += 12 * HOUR_MS) {
    const key = formatInTimeZone(at, timezone, format);
    if (!seen.has(key)) {
      seen.add(key);
      periods.push({ key, start: new Date(at) });
    }
  }
  return periods;
}
