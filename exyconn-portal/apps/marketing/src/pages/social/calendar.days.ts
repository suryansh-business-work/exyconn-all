import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

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

/** Each day of the grid with its posts, earliest first, in the viewer's own days. */
export function buildCalendar<T extends CalendarPost>(
  month: Date,
  posts: readonly T[],
  today: Date,
): CalendarDay<T>[] {
  const { from, to } = monthRange(month);
  const byDay = new Map<string, T[]>();
  for (const post of [...posts].sort(
    (a, b) => (postTime(a)?.getTime() ?? 0) - (postTime(b)?.getTime() ?? 0),
  )) {
    const at = postTime(post);
    if (!at) continue;
    const key = format(at, 'yyyy-MM-dd');
    byDay.set(key, [...(byDay.get(key) ?? []), post]);
  }
  return eachDayOfInterval({ start: from, end: new Date(to.getTime() - 1) }).map((date) => {
    const key = format(date, 'yyyy-MM-dd');
    return {
      date,
      key,
      inMonth: isSameMonth(date, month),
      isToday: isSameDay(date, today),
      posts: byDay.get(key) ?? [],
    };
  });
}
