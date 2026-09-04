import { format } from 'date-fns';
import { formatInTimeZone, fromZonedTime, getTimezoneOffset } from 'date-fns-tz';
import { deviceTimezone, isValidTimezone } from '@shared/timezone';

/**
 * The ONE place the app turns an instant into text. Every timestamp the employee sees — a
 * screenshot's capture time, "last synced", a day's bounds — is rendered in the zone they
 * chose (or the admin's house default, whichever the portal resolved for them). Nothing else
 * in the renderer may call `toLocaleString`, `date-fns/format` on an instant, or reach for
 * `Intl` directly: that is how a zone bug hides in one corner of the UI.
 *
 * A CALENDAR DATE is not an instant. `ReportDay.date` is a day key the portal already bucketed
 * using this same zone, so re-zoning it would shift it by a day near midnight. Those go through
 * `formatDayLabel`, which treats the key as a wall-calendar date and never converts it.
 */

/** Every zone the runtime knows, plus `current`, plus this device's — never a hardcoded list. */
export function timezoneNames(current: string): string[] {
  const names = new Set(Intl.supportedValuesOf('timeZone'));
  // `supportedValuesOf` is the PRE-canonicalisation list: it has `Asia/Calcutta` but not
  // `Asia/Kolkata`, and no `UTC` at all. Both are zones the portal accepts and an employee
  // can already be on, and an Autocomplete value that is absent from its own options is a
  // value MUI cannot render. So the two zones that matter here are added explicitly.
  for (const zone of [current, deviceTimezone()]) {
    if (isValidTimezone(zone)) {
      names.add(zone);
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

/** "UTC+05:30" — the zone's offset right now (date-fns does the arithmetic, we never do). */
export function offsetLabel(zone: string, at: Date = new Date()): string {
  if (!isValidTimezone(zone)) {
    return '';
  }
  return `UTC${formatInTimeZone(at, zone, 'xxx')}`;
}

/** Offset from UTC in minutes — sorts the zone list into a sane order. */
export function offsetMinutes(zone: string, at: Date = new Date()): number {
  return getTimezoneOffset(zone, at) / 60_000;
}

/** "10:42 AM" — when a screenshot was captured, in the employee's chosen zone. */
export function formatTimeOfDay(iso: string, zone: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) {
    return iso;
  }
  return formatInTimeZone(at, zone, 'h:mm a');
}

/** "Mon 3 Feb" for an INSTANT (e.g. a day's start bound), read in the chosen zone. */
export function formatDayInZone(iso: string, zone: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) {
    return iso;
  }
  return formatInTimeZone(at, zone, 'EEE d MMM');
}

/** "Mon 3 Feb, 10:42 AM" — a full instant, under a screenshot in the gallery. */
export function formatDateTime(iso: string, zone: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) {
    return iso;
  }
  return formatInTimeZone(at, zone, 'EEE d MMM, h:mm a');
}

/**
 * "Mon 3 Feb" for a day. A wall-calendar date, NOT an instant: a `YYYY-MM-DD` key from the
 * portal was already bucketed in the employee's zone, so converting it again would move it.
 */
export function formatDayLabel(day: Date | string): string {
  if (day instanceof Date) {
    return format(day, 'EEE d MMM');
  }
  const parts = /^(\d{4})-(\d{2})-(\d{2})/.exec(day);
  if (parts === null) {
    return day;
  }
  const [, year, month, date] = parts;
  const asCalendarDate = new Date(
    Number.parseInt(year, 10),
    Number.parseInt(month, 10) - 1,
    Number.parseInt(date, 10),
  );
  return format(asCalendarDate, 'EEE d MMM');
}

/** "February 2026" for the month switcher — a calendar month, so again no zone conversion. */
export function formatMonthLabel(month: Date): string {
  return format(month, 'LLLL yyyy');
}

/** "2m ago · 10:42 AM" — how long since the last sync, and when it was, in the chosen zone. */
export function formatLastSync(iso: string | null, zone: string, now: Date = new Date()): string {
  if (iso === null) {
    return 'Never';
  }
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) {
    return 'Never';
  }
  return `${relative(now.getTime() - then.getTime())} · ${formatTimeOfDay(iso, zone)}`;
}

/** An elapsed span in plain words. A duration has no timezone, so this one takes none. */
function relative(elapsedMs: number): string {
  const seconds = Math.max(0, Math.floor(elapsedMs / 1000));
  if (seconds < 60) {
    return 'Just now';
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  return `${Math.floor(hours / 24)}d ago`;
}

/** Midnight-to-midnight of `date`'s calendar day, IN the chosen zone, as ISO instants. */
export function dayBounds(date: Date, zone: string): { startISO: string; endISO: string } {
  const start = fromZonedTime(`${format(date, 'yyyy-MM-dd')}T00:00:00`, zone);
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  const end = fromZonedTime(`${format(next, 'yyyy-MM-dd')}T00:00:00`, zone);
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

/** The whole calendar month of `month`, IN the chosen zone, as ISO instants. */
export function monthBounds(month: Date, zone: string): { fromISO: string; toISO: string } {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const nextFirst = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  const from = fromZonedTime(`${format(first, 'yyyy-MM-dd')}T00:00:00`, zone);
  const to = fromZonedTime(`${format(nextFirst, 'yyyy-MM-dd')}T00:00:00`, zone);
  return { fromISO: from.toISOString(), toISO: to.toISOString() };
}
