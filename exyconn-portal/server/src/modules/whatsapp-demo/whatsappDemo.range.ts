import { badRequest } from '../../utils/errors';
import { zonedToEpoch } from './whatsappDemo.zone';

/** The longest window one analytics request may span. */
const MAX_RANGE_DAYS = 366;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface Range {
  from: Date;
  to: Date;
}

/** A plain `YYYY-MM-DD` is a whole day on the company's clock. */
const isDateOnly = (value: string) => value.length === 10 && !value.includes('T');

/** The day after a `YYYY-MM-DD`, in the same form. */
function nextDay(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}

/** Start of a date-only value's day in `timeZone`, or the instant an ISO date-time names. */
function instantOf(value: string, timeZone: string): Date {
  if (!isDateOnly(value)) {
    return new Date(value);
  }
  return new Date(zonedToEpoch(`${value}T00:00`, timeZone) ?? Number.NaN);
}

/**
 * Reads `from`/`to` (ISO). A date-only `to` includes its whole day, so the end is exclusive
 * at the next midnight on the company's clock.
 */
export function parseRange(from: string, to: string, timeZone: string): Range {
  const start = instantOf(from, timeZone);
  const end = instantOf(isDateOnly(to) ? nextDay(to) : to, timeZone);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    badRequest('Choose a valid date range.');
  }
  if (end.getTime() - start.getTime() > MAX_RANGE_DAYS * DAY_MS) {
    badRequest(`A range can span at most ${MAX_RANGE_DAYS} days.`);
  }
  return { from: start, to: end };
}

/** The optional range of the sessions grid. */
export function optionalRange(
  from: string | null | undefined,
  to: string | null | undefined,
  timeZone: string,
): Range | null {
  return from && to ? parseRange(from, to, timeZone) : null;
}

/** `instant`'s calendar date in `timeZone`, as Mongo's `$dateToString` writes it. */
export function dayKey(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

/** Every calendar day the range touches in `timeZone`, oldest first. */
export function daysOf(range: Range, timeZone: string): string[] {
  const last = dayKey(new Date(range.to.getTime() - 1), timeZone);
  const [year, month, day] = dayKey(range.from, timeZone).split('-').map(Number);
  const days: string[] = [];
  for (
    let cursor = Date.UTC(year, month - 1, day);
    days.length <= MAX_RANGE_DAYS;
    cursor += DAY_MS
  ) {
    const key = new Date(cursor).toISOString().slice(0, 10);
    days.push(key);
    if (key >= last) {
      break;
    }
  }
  return days;
}
