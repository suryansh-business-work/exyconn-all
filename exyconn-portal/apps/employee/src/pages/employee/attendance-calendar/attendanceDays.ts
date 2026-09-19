import { eachDayOfInterval, format, isSameMonth, isSameDay, startOfDay } from 'date-fns';
import { buildMonthDays } from '../calendar/buildMonth';

/** What a day on the attendance calendar shows, one colour per day. */
export type DayStatus =
  'PRESENT' | 'ABSENT' | 'LEAVE_APPROVED' | 'LEAVE_PENDING' | 'LEAVE_REJECTED' | 'HOLIDAY' | 'NONE';

export interface AttendanceInput {
  date: string;
  status: string;
}
export interface LeaveInput {
  fromDate: string;
  toDate: string;
  status: string;
}
export interface HolidayInput {
  date: string;
  name: string;
}

export interface AttendanceDay {
  date: Date;
  /** `yyyy-MM-dd`, stable across renders — the cell's key. */
  key: string;
  inMonth: boolean;
  isToday: boolean;
  status: DayStatus;
  /** The holiday's name on a holiday, whatever else the day shows. */
  holiday?: string;
}

/** Attendance statuses that mean the employee was working that day. */
const WORKED = new Set(['PRESENT', 'WFH', 'HALF_DAY']);

const LEAVE_STATUS: Readonly<Record<string, DayStatus>> = {
  APPROVED: 'LEAVE_APPROVED',
  PENDING: 'LEAVE_PENDING',
  REJECTED: 'LEAVE_REJECTED',
};

/** A leave's status, most binding first: an approved one outranks a pending or rejected one. */
const LEAVE_RANK: readonly DayStatus[] = ['LEAVE_APPROVED', 'LEAVE_PENDING', 'LEAVE_REJECTED'];

/**
 * Attendance is stored at midnight UTC of the employee's own day, so its UTC date IS that day;
 * reading it in local time would move it to the day before anywhere west of Greenwich.
 */
const attendanceKey = (iso: string) => iso.slice(0, 10);
const localKey = (date: Date) => format(date, 'yyyy-MM-dd');

/** Every local day a leave covers, both ends included. */
function leaveDays(leave: LeaveInput): string[] {
  const start = startOfDay(new Date(leave.fromDate));
  const end = startOfDay(new Date(leave.toDate));
  if (end < start) return [];
  return eachDayOfInterval({ start, end }).map(localKey);
}

/** The strongest leave status on each day. */
function leaveByDay(leaves: readonly LeaveInput[]): Map<string, DayStatus> {
  const byDay = new Map<string, DayStatus>();
  for (const leave of leaves) {
    const status = LEAVE_STATUS[leave.status];
    if (!status) continue;
    for (const key of leaveDays(leave)) {
      const current = byDay.get(key);
      if (!current || LEAVE_RANK.indexOf(status) < LEAVE_RANK.indexOf(current)) {
        byDay.set(key, status);
      }
    }
  }
  return byDay;
}

/**
 * One status per day, in this order: attendance you marked, then leave, then a holiday. What
 * you did outranks what was planned — marking attendance on a holiday shows that you worked.
 */
export function buildAttendanceMonth(
  month: Date,
  attendance: readonly AttendanceInput[],
  leaves: readonly LeaveInput[],
  holidays: readonly HolidayInput[],
  today: Date,
): AttendanceDay[] {
  const marked = new Map(attendance.map((row) => [attendanceKey(row.date), row.status]));
  const leave = leaveByDay(leaves);
  const holidayName = new Map(holidays.map((row) => [localKey(new Date(row.date)), row.name]));

  return buildMonthDays(month, [], [], today).map(({ date }) => {
    const key = localKey(date);
    const mark = marked.get(key);
    let status: DayStatus = 'NONE';
    if (mark !== undefined) status = WORKED.has(mark) ? 'PRESENT' : 'ABSENT';
    else if (leave.has(key)) status = leave.get(key) ?? 'NONE';
    else if (holidayName.has(key)) status = 'HOLIDAY';
    return {
      date,
      key,
      inMonth: isSameMonth(date, month),
      isToday: isSameDay(date, today),
      status,
      holiday: holidayName.get(key),
    };
  });
}
