import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

export const VIEWS = ['month', 'week', 'day'] as const;
export type CalendarView = (typeof VIEWS)[number];

const VIEW_SET: ReadonlySet<string> = new Set(VIEWS);
const DAY = 'yyyy-MM-dd';

/** What the address says: `?view=week&date=2026-10-19`. Unknown values fall back to this month. */
export function readCalendar(params: URLSearchParams, now: Date) {
  const rawView = params.get('view') ?? 'month';
  const view: CalendarView = VIEW_SET.has(rawView) ? (rawView as CalendarView) : 'month';
  const parsed = parseISO(params.get('date') ?? '');
  return { view, anchor: isValid(parsed) ? parsed : startOfDay(now) };
}

/** A day as the address and the cells key it. */
export const dayKey = (date: Date): string => format(date, DAY);

/** The days a view draws: whole weeks around a month, one week, or one day. */
export function viewDays(view: CalendarView, anchor: Date): Date[] {
  if (view === 'day') {
    return [startOfDay(anchor)];
  }
  const start = view === 'month' ? startOfWeek(startOfMonth(anchor)) : startOfWeek(anchor);
  const end = view === 'month' ? endOfWeek(endOfMonth(anchor)) : endOfWeek(anchor);
  return eachDayOfInterval({ start, end });
}

/**
 * What the server is asked for: the view's days plus a day either side. The cells are the
 * browser's days but items sit on the company's days, which can be up to a day apart.
 */
export function queryRange(days: readonly Date[]): { from: Date; to: Date } {
  return { from: addDays(days[0], -1), to: addDays(days.at(-1) ?? days[0], 2) };
}

/** The anchor one view earlier (-1) or later (+1). */
export function shiftAnchor(view: CalendarView, anchor: Date, step: 1 | -1): Date {
  if (view === 'month') {
    return addMonths(anchor, step);
  }
  return view === 'week' ? addWeeks(anchor, step) : addDays(anchor, step);
}

/** Items by the company-zone day they fall on, each day earliest first. */
export function itemsByDay<T extends { startAt: string }>(
  items: readonly T[],
  timezone: string,
): Map<string, T[]> {
  const byDay = new Map<string, T[]>();
  const sorted = [...items].sort((a, b) => a.startAt.localeCompare(b.startAt));
  for (const item of sorted) {
    const key = formatInTimeZone(new Date(item.startAt), timezone, DAY);
    byDay.set(key, [...(byDay.get(key) ?? []), item]);
  }
  return byDay;
}
