import { differenceInCalendarDays, isSameDay, isSameMonth, isAfter } from 'date-fns';
import { toDate } from '@exyconn/shell/utils/date';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'WFH' | 'HALF_DAY';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AttendanceRecord {
  date: string;
  status: AttendanceStatus;
}
export interface LeaveRecord {
  fromDate: string;
  toDate: string;
  status: LeaveStatus;
}
export interface HolidayRecord {
  id: string;
  name: string;
  date: string;
}
export interface SalarySlipRecord {
  month: number;
  year: number;
}

/** Milliseconds for a stored date, or null when it cannot be parsed. */
function timeOf(value: string): number | null {
  return toDate(value)?.getTime() ?? null;
}

/** Today's attendance record, or null when nothing has been marked yet. */
export function todayAttendance<T extends AttendanceRecord>(records: T[], today: Date): T | null {
  return (
    records.find((r) => {
      const date = toDate(r.date);
      return date ? isSameDay(date, today) : false;
    }) ?? null
  );
}

/** How many days of each status were recorded in the month `ref` falls in. */
export function monthAttendance(
  records: AttendanceRecord[],
  ref: Date,
): Record<AttendanceStatus, number> {
  const totals: Record<AttendanceStatus, number> = { PRESENT: 0, ABSENT: 0, WFH: 0, HALF_DAY: 0 };
  for (const record of records) {
    const date = toDate(record.date);
    if (date && isSameMonth(date, ref)) totals[record.status] += 1;
  }
  return totals;
}

/** Inclusive day count of a leave request. */
export function leaveDays(leave: LeaveRecord): number {
  const from = toDate(leave.fromDate);
  const to = toDate(leave.toDate);
  if (!from || !to) return 0;
  return differenceInCalendarDays(to, from) + 1;
}

/**
 * Leave standing for the year `ref` falls in. There is no entitlement in the
 * data model, so this reports what was actually taken and what is still waiting
 * rather than inventing a balance.
 */
export function leaveSummary(requests: LeaveRecord[], ref: Date) {
  let pending = 0;
  let approvedDays = 0;
  for (const request of requests) {
    if (request.status === 'PENDING') pending += 1;
    const inYear = toDate(request.fromDate)?.getFullYear() === ref.getFullYear();
    if (request.status === 'APPROVED' && inYear) approvedDays += leaveDays(request);
  }
  return { pending, approvedDays };
}

/** The next holidays after `today`, soonest first. */
export function upcomingHolidays<T extends HolidayRecord>(
  holidays: T[],
  today: Date,
  limit = 3,
): T[] {
  return (
    holidays
      .filter((h) => {
        const date = toDate(h.date);
        return date ? isAfter(date, today) : false;
      })
      // filter() already returned a fresh array, so sorting it cannot touch the caller's.
      .sort((a, b) => (timeOf(a.date) ?? 0) - (timeOf(b.date) ?? 0))
      .slice(0, limit)
  );
}

/** Most recent slip by year then month. */
export function latestSalarySlip<T extends SalarySlipRecord>(slips: T[]): T | null {
  if (slips.length === 0) return null;
  return slips.reduce((latest, slip) =>
    slip.year * 12 + slip.month > latest.year * 12 + latest.month ? slip : latest,
  );
}
