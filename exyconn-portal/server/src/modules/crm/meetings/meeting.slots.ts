import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

export interface Availability {
  durationMinutes: number;
  timezone: string;
  weeklyHours: Array<{ day: number; enabled: boolean; start: string; end: string }>;
  bufferMinutes: number;
  minNoticeHours: number;
  maxDaysAhead: number;
}

export interface Busy {
  startAt: Date;
  endAt: Date;
}

/** The calendar days from one to the other as the host's zone counts them ("2026-10-16"). */
function daysBetween(from: Date, to: Date, timezone: string): string[] {
  const days: string[] = [];
  for (let at = from.getTime(); at <= to.getTime() + DAY; at += DAY) {
    const day = formatInTimeZone(new Date(at), timezone, 'yyyy-MM-dd');
    if (!days.includes(day)) {
      days.push(day);
    }
  }
  return days;
}

/** The weekday of a calendar date, 0 = Sunday, whatever zone it is in. */
const weekdayOf = (day: string) => new Date(`${day}T12:00:00Z`).getUTCDay();

/** Whether a meeting at this start, with the buffer either side, clashes with a busy time. */
function clashes(start: number, end: number, buffer: number, busy: Busy[]): boolean {
  return busy.some((b) => start - buffer < b.endAt.getTime() && end + buffer > b.startAt.getTime());
}

/**
 * Every free start between `from` and `to`: inside the host's weekly hours (in their zone),
 * after the minimum notice, within the booking window, and clear of what is booked already.
 * Starts fall every `durationMinutes` from the opening of the day.
 */
export function freeSlots(
  type: Availability,
  from: Date,
  to: Date,
  busy: Busy[],
  now = new Date(),
): Date[] {
  const earliest = Math.max(from.getTime(), now.getTime() + type.minNoticeHours * 60 * MINUTE);
  const latest = Math.min(to.getTime(), now.getTime() + type.maxDaysAhead * DAY);
  const length = type.durationMinutes * MINUTE;
  const buffer = type.bufferMinutes * MINUTE;
  const slots: Date[] = [];
  for (const day of daysBetween(from, to, type.timezone)) {
    const hours = type.weeklyHours.find((h) => h.day === weekdayOf(day) && h.enabled);
    if (!hours) {
      continue;
    }
    const open = fromZonedTime(`${day}T${hours.start}:00`, type.timezone).getTime();
    const close = fromZonedTime(`${day}T${hours.end}:00`, type.timezone).getTime();
    for (let start = open; start + length <= close; start += length) {
      const inWindow = start >= earliest && start + length <= latest;
      if (inWindow && !clashes(start, start + length, buffer, busy)) {
        slots.push(new Date(start));
      }
    }
  }
  return slots;
}
