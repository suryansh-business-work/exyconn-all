import type { RecurrenceFrequency } from './recurring-invoice.model';

/**
 * When a schedule next falls due. Pure — no clock, no database — so every awkward calendar
 * case is a table test rather than something only reproducible on the 31st.
 */

/** Days added per period for the frequencies that are simply a number of days. */
const DAYS: Partial<Record<RecurrenceFrequency, number>> = { WEEKLY: 7 };

/** Months added per period for the frequencies measured in months. */
const MONTHS: Partial<Record<RecurrenceFrequency, number>> = {
  MONTHLY: 1,
  QUARTERLY: 3,
  YEARLY: 12,
};

/**
 * One period after `from`.
 *
 * Month arithmetic CLAMPS to the end of the target month rather than overflowing: a retainer
 * that starts on the 31st bills 28 February, not 3 March. `setMonth` on a Date rolls over on
 * its own, which is how monthly billing quietly drifts a day later every short month until
 * it has walked out of the month it belongs to.
 */
export function nextOccurrence(from: Date, frequency: RecurrenceFrequency): Date {
  const days = DAYS[frequency];
  if (days !== undefined) {
    const next = new Date(from);
    next.setDate(next.getDate() + days);
    return next;
  }

  const months = MONTHS[frequency] ?? 1;
  const targetMonth = from.getMonth() + months;
  // Day 0 of the month AFTER the target is the last day of the target month.
  const lastDayOfTarget = new Date(from.getFullYear(), targetMonth + 1, 0).getDate();
  const next = new Date(from);
  next.setFullYear(from.getFullYear(), targetMonth, Math.min(from.getDate(), lastDayOfTarget));
  return next;
}

/** The fields the due check reads — the stored schedule, or anything shaped like it. */
export interface RecurringShape {
  active: boolean;
  nextRunAt: Date;
  endDate?: Date | null;
}

/**
 * Whether a schedule should raise an invoice now.
 *
 * "The moment has passed" rather than an exact match, so a restart or a busy tick does not
 * lose a period. A schedule past its end date is finished, whatever its `nextRunAt` says.
 */
export function isDue(schedule: RecurringShape, now: Date): boolean {
  if (!schedule.active) {
    return false;
  }
  if (schedule.endDate && schedule.endDate.getTime() < now.getTime()) {
    return false;
  }
  return schedule.nextRunAt.getTime() <= now.getTime();
}

/** The due date an invoice issued on `issuedDate` carries. */
export function dueDateFor(issuedDate: Date, dueDays: number): Date {
  const due = new Date(issuedDate);
  due.setDate(due.getDate() + dueDays);
  return due;
}
