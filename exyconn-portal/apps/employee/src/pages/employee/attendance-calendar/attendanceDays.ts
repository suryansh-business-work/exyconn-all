import { eachDayOfInterval, format, getDay, isSameMonth, isSameDay, startOfDay } from 'date-fns';
import { buildMonthDays } from '../calendar/buildMonth';

/** What a day on the attendance calendar shows, one colour per day. */
export type DayStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LEAVE_APPROVED'
  | 'LEAVE_PENDING'
  | 'LEAVE_REJECTED'
  | 'HOLIDAY'
  | 'WEEK_OFF'
  | 'NONE';

export interface AttendanceInput {
  date: string;
  status: string;
}
export interface LeaveInput {
  /** The leave type's code, e.g. CL or EL. */
  type?: string;
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
  /** The leave type's code (CL, EL) when the day shows leave. */
  leaveType?: string;
}

/** One day's strongest leave: its status and its type's code. */
interface DayLeave {
  status: DayStatus;
  type?: string;
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

/** The strongest leave on each day. */
function leaveByDay(leaves: readonly LeaveInput[]): Map<string, DayLeave> {
  const byDay = new Map<string, DayLeave>();
  for (const leave of leaves) {
    const status = LEAVE_STATUS[leave.status];
    if (!status) continue;
    for (const key of leaveDays(leave)) {
      const current = byDay.get(key);
      if (!current || LEAVE_RANK.indexOf(status) < LEAVE_RANK.indexOf(current.status)) {
        byDay.set(key, { status, type: leave.type });
      }
    }
  }
  return byDay;
}

interface DayFacts {
  mark: string | undefined;
  holiday: string | undefined;
  weekOff: boolean;
  leave: DayLeave | undefined;
}

/**
 * One status per day, in this order: attendance you marked, then a holiday, then your week
 * off, then leave — the order the server reads an unmarked day in. What you did outranks
 * what was planned: marking attendance on a holiday shows that you worked.
 */
function statusOf({ mark, holiday, weekOff, leave }: DayFacts): DayStatus {
  if (mark !== undefined) return WORKED.has(mark) ? 'PRESENT' : 'ABSENT';
  if (holiday !== undefined) return 'HOLIDAY';
  if (weekOff) return 'WEEK_OFF';
  return leave?.status ?? 'NONE';
}

/** Every day of the month's grid with its status, the holiday's name and the leave's code. */
export function buildAttendanceMonth(
  month: Date,
  attendance: readonly AttendanceInput[],
  leaves: readonly LeaveInput[],
  holidays: readonly HolidayInput[],
  today: Date,
  /** The weekdays the employee works (0 is Sunday); no week off is shown until it is known. */
  workDays?: readonly number[],
): AttendanceDay[] {
  const marked = new Map(attendance.map((row) => [attendanceKey(row.date), row.status]));
  const leave = leaveByDay(leaves);
  const holidayName = new Map(holidays.map((row) => [localKey(new Date(row.date)), row.name]));
  const working = workDays ? new Set(workDays) : null;

  return buildMonthDays(month, [], [], today).map(({ date }) => {
    const key = localKey(date);
    const dayLeave = leave.get(key);
    const status = statusOf({
      mark: marked.get(key),
      holiday: holidayName.get(key),
      weekOff: working !== null && !working.has(getDay(date)),
      leave: dayLeave,
    });
    return {
      date,
      key,
      inMonth: isSameMonth(date, month),
      isToday: isSameDay(date, today),
      status,
      holiday: holidayName.get(key),
      leaveType: status === dayLeave?.status ? dayLeave.type : undefined,
    };
  });
}
