const DAY_MS = 24 * 60 * 60 * 1000;

/** The day part of an instant, as `YYYY-MM-DD` — what a dedupe key is keyed on. */
export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** The instant `days` from now, for "expiring within a fortnight" style questions. */
export function daysFromNow(now: Date, days: number): Date {
  return new Date(now.getTime() + days * DAY_MS);
}

/** Whole days from `now` until `date`, rounded up. Negative once the date has passed. */
export function daysUntil(now: Date, date: Date): number {
  // `|| 0` for the sign of zero: this morning rounds up to -0, which prints as "-0 days".
  return Math.ceil((date.getTime() - now.getTime()) / DAY_MS) || 0;
}

/**
 * How a reminder says when something is due, in words.
 *
 * "in 3 days" and "5 days ago" rather than a date, because the reader is being told to act
 * now and the arithmetic is the whole message.
 */
export function dueInWords(days: number): string {
  if (days < 0) {
    const late = Math.abs(days);
    return late === 1 ? 'yesterday' : `${late} days ago`;
  }
  if (days === 0) {
    return 'today';
  }
  return days === 1 ? 'tomorrow' : `in ${days} days`;
}
