/**
 * Calendar months as the report browses them. A month here is a WALL-CALENDAR month (its first
 * day at local midnight), never an instant — `monthBounds` in tracker-core is what turns it into
 * the employee's zone when the portal is asked.
 */

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** The month `months` before (negative) or after (positive) `month`. */
export function shiftMonth(month: Date, months: number): Date {
  return new Date(month.getFullYear(), month.getMonth() + months, 1);
}

/** "2026-02" — the month as a file name can carry it, and as it sorts. */
export function monthKeyOf(month: Date): string {
  return `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
}

/** The employee cannot page into a month that has not started. */
export function canGoForward(month: Date, today: Date): boolean {
  return startOfMonth(month).getTime() < startOfMonth(today).getTime();
}
