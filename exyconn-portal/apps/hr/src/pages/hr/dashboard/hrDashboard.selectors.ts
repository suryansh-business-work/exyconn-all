import { isSameDay, isSameMonth } from 'date-fns';
import { toDate } from '@exyconn/shell/utils/date';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'WFH' | 'HALF_DAY';

export interface AttendanceRow {
  date: string;
  status: AttendanceStatus;
}
export interface LeaveRow {
  id: string;
  employeeId: string;
  type: string;
  fromDate: string;
  toDate: string;
  status: string;
}
export interface UserRow {
  id: string;
  name: string;
  joinDate?: string | null;
  isActive: boolean;
}

/** Everyone's attendance marked for `today`, per status. */
export function todayAttendance(
  rows: AttendanceRow[],
  today: Date,
): Record<AttendanceStatus, number> {
  const totals: Record<AttendanceStatus, number> = { PRESENT: 0, ABSENT: 0, WFH: 0, HALF_DAY: 0 };
  for (const row of rows) {
    const date = toDate(row.date);
    if (date && isSameDay(date, today)) totals[row.status] += 1;
  }
  return totals;
}

export interface PendingLeave extends LeaveRow {
  employeeName: string;
}

/** Leave still waiting on HR, oldest first so the longest wait is on top, with names joined. */
export function pendingLeave(leave: LeaveRow[], users: UserRow[]): PendingLeave[] {
  const nameOf = new Map(users.map((u) => [u.id, u.name]));
  return leave
    .filter((l) => l.status === 'PENDING')
    .map((l) => ({ ...l, employeeName: nameOf.get(l.employeeId) ?? l.employeeId }))
    .sort((a, b) => (toDate(a.fromDate)?.getTime() ?? 0) - (toDate(b.fromDate)?.getTime() ?? 0));
}

/** People whose joining date falls in the month `ref` is in. */
export function newJoiners(users: UserRow[], ref: Date): UserRow[] {
  return users.filter((u) => {
    const joined = toDate(u.joinDate);
    return joined ? isSameMonth(joined, ref) : false;
  });
}

/** Active vs inactive split of the workforce. */
export function activeSplit(users: UserRow[]): { active: number; inactive: number } {
  let active = 0;
  for (const u of users) if (u.isActive) active += 1;
  return { active, inactive: users.length - active };
}
