import {
  addDays,
  addHours,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfHour,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';

/** The hour a post planned on the calendar goes out at, unless that is already past. */
const DEFAULT_HOUR = 10;

/** How a day is keyed: the grid's cells by their own date, posts by their date in the zone. */
const DAY_KEY = 'yyyy-MM-dd';

/** The calendar day an instant falls on in the workspace's timezone. */
export const dayKeyIn = (at: Date, timezone: string): string =>
  formatInTimeZone(at, timezone, DAY_KEY);

/** The instant a whole hour on a calendar day is, as a wall clock in the workspace's timezone. */
export const wallClock = (dayKey: string, hour: number, timezone: string): Date =>
  fromZonedTime(`${dayKey}T${String(hour).padStart(2, '0')}:00:00`, timezone);

/** A post as the calendar places it: on the day it went, or is due to go, out. */
export interface CalendarPost {
  id: string;
  status: string;
  network: string;
  scheduledAt?: string | null;
  publishedAt?: string | null;
}

export interface CalendarDay<T extends CalendarPost> {
  date: Date;
  key: string;
  inMonth: boolean;
  isToday: boolean;
  /** Before today: nothing new can be planned on it. */
  isPast: boolean;
  posts: T[];
}

/** The instant a post belongs to on the calendar: when it went out, else when it will. */
export const postTime = (post: CalendarPost): Date | null => {
  const at = post.publishedAt ?? post.scheduledAt;
  return at ? new Date(at) : null;
};

/** The whole weeks around a month, Sunday first — the range the calendar asks for. */
export function monthRange(month: Date): { from: Date; to: Date } {
  const from = startOfWeek(startOfMonth(month));
  const last = endOfWeek(endOfMonth(month));
  return { from, to: new Date(last.getTime() + 1) };
}

/**
 * What the calendar asks the server for: the grid's weeks plus a day either side. The cells
 * are the browser's days but posts are placed by the workspace's, and the two can be up to a
 * day apart — without the margin a post in the grid's first or last hours would be missing.
 */
export function queryRange(month: Date): { from: Date; to: Date } {
  const { from, to } = monthRange(month);
  return { from: addDays(from, -1), to: addDays(to, 1) };
}

/**
 * Each day of the grid with its posts, earliest first. A post sits on its date in the
 * workspace's timezone — the zone its time is written in — and "today" is that zone's today.
 */
export function buildCalendar<T extends CalendarPost>(
  month: Date,
  posts: readonly T[],
  now: Date,
  timezone: string,
): CalendarDay<T>[] {
  const { from, to } = monthRange(month);
  const timed = posts
    .flatMap((post) => {
      const at = postTime(post);
      return at ? [{ post, at }] : [];
    })
    .sort((a, b) => a.at.getTime() - b.at.getTime());
  const byDay = new Map<string, T[]>();
  for (const { post, at } of timed) {
    const key = dayKeyIn(at, timezone);
    byDay.set(key, [...(byDay.get(key) ?? []), post]);
  }
  const today = dayKeyIn(now, timezone);
  return eachDayOfInterval({ start: from, end: new Date(to.getTime() - 1) }).map((date) => {
    const key = format(date, DAY_KEY);
    return {
      date,
      key,
      inMonth: isSameMonth(date, month),
      isToday: key === today,
      isPast: key < today,
      posts: byDay.get(key) ?? [],
    };
  });
}

/**
 * When a post planned on a day goes out: 10:00 that day in the workspace's timezone, or the
 * zone's next whole hour once that has passed.
 */
export function defaultScheduleTime(dayKey: string, now: Date, timezone: string): Date {
  const usual = wallClock(dayKey, DEFAULT_HOUR, timezone);
  if (usual > now) return usual;
  return fromZonedTime(startOfHour(addHours(toZonedTime(now, timezone), 1)), timezone);
}
