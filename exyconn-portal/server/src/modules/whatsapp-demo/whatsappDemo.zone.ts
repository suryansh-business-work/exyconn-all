import { companyProfile } from '../../lib/company';
import { isValidTimezone } from '../../utils/timezone';

/** Used only when the company has no valid timezone of its own. */
const DEFAULT_TIMEZONE = 'Asia/Kolkata';

/** The zone the demo's dates are read in: the company's own, else India's. */
export async function companyTimezone(): Promise<string> {
  try {
    const { timezone } = await companyProfile();
    return isValidTimezone(timezone) ? timezone : DEFAULT_TIMEZONE;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

/** The wall-clock fields `instant` reads as in `timeZone`. */
function wallClock(instant: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'long',
  }).formatToParts(new Date(instant));
  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return {
    year: Number(read('year')),
    month: Number(read('month')),
    day: Number(read('day')),
    hour: Number(read('hour')),
    minute: Number(read('minute')),
    weekday: read('weekday'),
  };
}

/** How far `timeZone` is ahead of UTC at `instant`. */
function offsetMs(instant: number, timeZone: string): number {
  const c = wallClock(instant, timeZone);
  return (
    Date.UTC(c.year, c.month - 1, c.day, c.hour, c.minute) - Math.floor(instant / 60_000) * 60_000
  );
}

const pad = (value: number) => String(value).padStart(2, '0');

/** Now on the business's clock, for the model to resolve "tomorrow" against. */
export function localNow(instant: number, timeZone: string): string {
  const c = wallClock(instant, timeZone);
  return `${c.weekday} ${c.year}-${pad(c.month)}-${pad(c.day)} ${pad(c.hour)}:${pad(c.minute)}`;
}

/** Splits `value` on `separator` into integers, or null when any part is not one. */
function numbers(value: string, separator: string, count: number): number[] | null {
  const parts = value.split(separator);
  if (parts.length !== count) {
    return null;
  }
  const result = parts.map((part) => Number.parseInt(part, 10));
  return result.every((n) => Number.isFinite(n)) ? result : null;
}

/** `YYYY-MM-DDTHH:mm` on the clock in `timeZone`, as epoch ms; null when unreadable. */
export function zonedToEpoch(local: string, timeZone: string): number | null {
  const [datePart, timePart = '00:00'] = local.trim().split('T');
  const date = numbers(datePart, '-', 3);
  const time = numbers(timePart.slice(0, 5), ':', 2);
  if (!date || !time) {
    return null;
  }
  const guess = Date.UTC(date[0], date[1] - 1, date[2], time[0], time[1]);
  if (Number.isNaN(guess)) {
    return null;
  }
  const first = guess - offsetMs(guess, timeZone);
  // Once more at the corrected instant, so a date across a DST change lands right.
  return guess - offsetMs(first, timeZone);
}
