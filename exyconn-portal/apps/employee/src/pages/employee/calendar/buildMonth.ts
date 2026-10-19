import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isWithinInterval,
  isSameDay,
  getDay,
} from 'date-fns';

/** A single cell of the month grid, with holiday / leave overlays resolved. */
export interface DayMarker {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  holiday?: string;
  onLeave: boolean;
  /** The code of the leave type (CL, EL) of the first leave on this day. */
  leaveType?: string;
  /** A day outside the employee's working week. */
  weekOff: boolean;
}

type HolidayInput = { date: string; name: string };
type LeaveInput = { fromDate: string; toDate: string; type?: string };

/** True when `date` falls on, or between, a leave request's from/to (inclusive). */
function isDayOnLeave(date: Date, leave: LeaveInput): boolean {
  const start = new Date(leave.fromDate);
  const end = new Date(leave.toDate);
  if (end < start) return false;
  return isSameDay(date, start) || isSameDay(date, end) || isWithinInterval(date, { start, end });
}

/**
 * Build the full month grid — whole weeks, Sunday-first — from
 * startOfWeek(startOfMonth) to endOfWeek(endOfMonth), overlaying company
 * holidays and the employee's own leave onto each day. Pure — no React.
 */
export function buildMonthDays(
  month: Date,
  holidays: HolidayInput[],
  leaves: LeaveInput[],
  today: Date,
  /** The weekdays the employee works (0 is Sunday); no week off is marked until it is known. */
  workDays?: readonly number[],
): DayMarker[] {
  const working = workDays ? new Set(workDays) : null;
  const gridStart = startOfWeek(startOfMonth(month));
  const gridEnd = endOfWeek(endOfMonth(month));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return days.map((date) => {
    const leave = leaves.find((candidate) => isDayOnLeave(date, candidate));
    return {
      date,
      inMonth: isSameMonth(date, month),
      isToday: isSameDay(date, today),
      holiday: holidays.find((h) => isSameDay(date, new Date(h.date)))?.name,
      onLeave: leave !== undefined,
      leaveType: leave?.type,
      weekOff: working !== null && !working.has(getDay(date)),
    };
  });
}
