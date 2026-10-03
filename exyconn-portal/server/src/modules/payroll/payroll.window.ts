import { zonedParts } from './payroll.schedule';
import { periodLabel } from './payslip.pdf';

/**
 * When a month's payroll may be run.
 *
 * A month opens on day `runFromDay` of that same month, on the company's own clock — the
 * 25th means the 25th where the company is, not in UTC — and stays open from then on. A
 * month that has not reached that day yet, a future month included, cannot be run.
 */
export interface PayrollWindow {
  /** The instant the month opens: midnight of `runFromDay` in the company's timezone. */
  opensOn: Date;
  open: boolean;
}

/** A calendar date as one sortable number, so two dates compare with `<`. */
function dayNumber(year: number, month: number, day: number): number {
  return year * 10_000 + month * 100 + day;
}

/**
 * The UTC instant at which a wall clock in `timeZone` reads midnight on the given date.
 *
 * The zone's offset is read at a first guess and the guess corrected by it; a second read
 * at the corrected instant catches a date whose offset differs from the guess's (DST).
 * Every instant here is a whole minute, which is as fine as any zone's offset goes.
 */
export function zonedMidnight(year: number, month: number, day: number, timeZone: string): Date {
  const target = Date.UTC(year, month - 1, day);
  const offsetAt = (instant: number) => {
    const p = zonedParts(new Date(instant), timeZone);
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - instant;
  };
  const first = target - offsetAt(target);
  return new Date(target - offsetAt(first));
}

/** Whether the payroll for `month`/`year` may run at `now`, and from when. */
export function payrollWindow(
  month: number,
  year: number,
  runFromDay: number,
  timeZone: string,
  now: Date,
): PayrollWindow {
  const today = zonedParts(now, timeZone);
  return {
    opensOn: zonedMidnight(year, month, runFromDay, timeZone),
    open: dayNumber(today.year, today.month, today.day) >= dayNumber(year, month, runFromDay),
  };
}

/** The sentence a refused run is told, naming the day the month opens. */
export function windowClosedMessage(month: number, year: number, runFromDay: number): string {
  const period = periodLabel(month, year);
  return `Payroll for ${period} opens on ${runFromDay} ${period} and cannot be run before then.`;
}
