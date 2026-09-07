import { LeaveBalanceModel } from '../hrmaster/leaveBalance.model';
import { badRequest } from '../../utils/errors';

/** The slice of a leave request the balance needs to know about. */
export interface LeaveSpan {
  employeeId: string;
  type: string;
  fromDate: Date;
  toDate: Date;
}

/** Unpaid leave is unmetered: it prorates pay instead of consuming a balance. */
const UNMETERED_TYPE = 'UNPAID';
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const utcDay = (date: Date) =>
  Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

/** Inclusive calendar days a request covers, so a one-day leave costs one day. */
export function leaveDays(fromDate: Date, toDate: Date): number {
  return Math.round((utcDay(toDate) - utcDay(fromDate)) / MS_PER_DAY) + 1;
}

/** Mirrors the GraphQL `available` field so both can never disagree. */
export function availableOf(balance: {
  allocated: number;
  carriedForward: number;
  adjustment: number;
  used: number;
}): number {
  return balance.allocated + balance.carriedForward + balance.adjustment - balance.used;
}

const balanceKey = (leave: LeaveSpan) => ({
  employeeId: leave.employeeId,
  leaveTypeCode: leave.type,
  year: leave.fromDate.getUTCFullYear(),
});

/**
 * Consumes the request's days from the employee's balance for that type and year.
 * Refuses rather than letting `used` overrun what was allocated: an approval that
 * silently went negative is exactly the number HR could no longer trust.
 */
export async function debitLeaveBalance(leave: LeaveSpan): Promise<void> {
  if (leave.type === UNMETERED_TYPE) return;
  const key = balanceKey(leave);
  const balance = await LeaveBalanceModel.findOne(key).lean();
  if (!balance) {
    badRequest(
      `No leave balance for ${key.leaveTypeCode} in ${key.year} — add one under HR > Leave Balances`,
    );
  }
  const days = leaveDays(leave.fromDate, leave.toDate);
  const available = availableOf(balance);
  if (available < days) {
    badRequest(
      `Only ${available} ${key.leaveTypeCode} day(s) left in ${key.year}; this request needs ${days}`,
    );
  }
  await LeaveBalanceModel.updateOne({ _id: balance._id }, { $inc: { used: days } });
}

/** Gives the days back when an approval is withdrawn. Never drives `used` below zero. */
export async function creditLeaveBalance(leave: LeaveSpan): Promise<void> {
  if (leave.type === UNMETERED_TYPE) return;
  const balance = await LeaveBalanceModel.findOne(balanceKey(leave)).lean();
  if (!balance) return;
  const used = Math.max(0, balance.used - leaveDays(leave.fromDate, leave.toDate));
  await LeaveBalanceModel.updateOne({ _id: balance._id }, { used });
}
