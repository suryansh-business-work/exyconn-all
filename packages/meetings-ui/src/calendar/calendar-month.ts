import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isValid,
  parse,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

const MONTH = 'yyyy-MM';
const DAY = 'yyyy-MM-dd';
const DAY_MS = 86_400_000;

/** One cell of the month grid: a calendar day, not an instant. */
export interface CalendarDay {
  date: Date;
  key: string;
  inMonth: boolean;
}

/** The month the address names (`?month=2026-10`), else the month `todayKey` falls in. */
export function readMonth(value: string | null, todayKey: string): Date {
  const parsed = parse(value ?? '', MONTH, new Date(0));
  if (value && isValid(parsed)) {
    return parsed;
  }
  return parse(todayKey.slice(0, 7), MONTH, new Date(0));
}

/** The month as the address writes it. */
export const monthParam = (month: Date): string => format(month, MONTH);

/** The month before (-1) or after (+1). */
export const shiftMonth = (month: Date, step: 1 | -1): Date => addMonths(month, step);

/** Whole weeks around the month, Sunday first: 35 or 42 days. */
export function monthDays(month: Date): CalendarDay[] {
  const start = startOfWeek(startOfMonth(month));
  const end = endOfWeek(endOfMonth(month));
  return eachDayOfInterval({ start, end }).map((date) => ({
    date,
    key: format(date, DAY),
    inMonth: isSameMonth(date, month),
  }));
}

/**
 * What the server is asked for: the month's days in UTC with a day either side, since the
 * viewer's own zone can put an instant up to a day away. Never more than 33 days.
 */
export function monthRange(month: Date): { from: string; to: string } {
  const first = Date.UTC(month.getFullYear(), month.getMonth(), 1);
  const next = Date.UTC(month.getFullYear(), month.getMonth() + 1, 1);
  return {
    from: new Date(first - DAY_MS).toISOString(),
    to: new Date(next + DAY_MS).toISOString(),
  };
}
