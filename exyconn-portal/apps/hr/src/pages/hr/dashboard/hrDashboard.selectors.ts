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
  dateOfBirth?: string | null;
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

export interface Recurring {
  user: UserRow;
  /** The date in the current cycle. */
  on: Date;
  daysAway: number;
}

export interface Anniversary extends Recurring {
  /** Completed years on the upcoming date (1 = first anniversary). */
  years: number;
}

const DAY = 24 * 60 * 60 * 1000;

/**
 * The next occurrence of an anniversary-style date within `withinDays`, soonest
 * first. A date earlier this year that has already passed rolls to next year.
 * `minYears` drops occurrences with fewer completed years, which is how a person
 * who joined this year is excluded from work anniversaries.
 */
function upcomingRecurring(
  users: UserRow[],
  today: Date,
  pick: (user: UserRow) => string | null | undefined,
  withinDays: number,
  minYears: number,
): (Recurring & { years: number })[] {
  const start = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const out: (Recurring & { years: number })[] = [];
  for (const user of users) {
    const source = toDate(pick(user));
    if (!source || !user.isActive) continue;
    let on = Date.UTC(today.getUTCFullYear(), source.getUTCMonth(), source.getUTCDate());
    if (on < start) {
      on = Date.UTC(today.getUTCFullYear() + 1, source.getUTCMonth(), source.getUTCDate());
    }
    const years = new Date(on).getUTCFullYear() - source.getUTCFullYear();
    if (years < minYears) continue;
    const daysAway = Math.round((on - start) / DAY);
    if (daysAway <= withinDays) out.push({ user, years, on: new Date(on), daysAway });
  }
  return out.sort((a, b) => a.daysAway - b.daysAway);
}

/** Work anniversaries in the next `withinDays`. Someone who joined this year is a new joiner. */
export function upcomingAnniversaries(
  users: UserRow[],
  today: Date,
  withinDays = 30,
): Anniversary[] {
  return upcomingRecurring(users, today, (u) => u.joinDate, withinDays, 1);
}

/** Birthdays in the next `withinDays`. Only the day and month are ever used. */
export function upcomingBirthdays(users: UserRow[], today: Date, withinDays = 30): Recurring[] {
  return upcomingRecurring(users, today, (u) => u.dateOfBirth, withinDays, 0);
}
