import { toDate } from '@exyconn/shell/utils/date';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Leave that prorates pay instead of using a balance, as the server treats it. */
export const UNMETERED_TYPE = 'UNPAID';

/**
 * Calendar days a request covers, both ends included — a one-day leave is one day, as the
 * server counts it when the request is approved. 0 until both dates are set and in order.
 */
export function leaveDays(fromDate: string, toDateValue: string): number {
  const from = toDate(fromDate);
  const to = toDate(toDateValue);
  if (!from || !to || to < from) return 0;
  const day = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((day(to) - day(from)) / MS_PER_DAY) + 1;
}
