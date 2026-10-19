import { formatInTimeZone } from 'date-fns-tz';
import { formatHoursMinutes } from './format';

/**
 * Worked time measured against the employee's contract. The portal decides what each day was
 * worth (working day, weekend, holiday, leave); this compares it with what was worked, the
 * same way on the portal, the desktop and the phone.
 */

/** One day's contracted time, as the portal's `trackerExpected` returns it. */
export interface ExpectedDay {
  date: string;
  expectedMs: number;
  /** WEEKEND, HOLIDAY or LEAVE; null on a working day. */
  offReason?: string | null;
}

/** The employee's contract over a range, as the portal's `trackerExpected` returns it. */
export interface ExpectedRange {
  workHoursPerDay: number;
  days: readonly ExpectedDay[];
}

/** The slice of a day bucket the comparison reads. */
export interface WorkedDay {
  date: string;
  activeMs: number;
  /** Approved off-computer time, which counts towards the day like measured time does. */
  manualMs?: number | null;
}

/** The month's hours report as the portal generates it: an XLSX, base64-encoded. */
export interface HoursReportFile {
  fileName: string;
  mimeType: string;
  contentBase64: string;
}

/** The month against its contract. Every figure is in milliseconds. */
export interface MonthTarget {
  /** Contracted time over the whole range. */
  expectedMs: number;
  /** Contracted time over the days already over (before today). */
  expectedSoFarMs: number;
  /** Measured plus approved off-computer time over the range. */
  workedMs: number;
  /** `workedMs - expectedSoFarMs`: negative while the employee is behind. */
  deficitMs: number;
  /** Finished working days that fell short of their contracted time. */
  shortDates: ReadonlySet<string>;
  /** Working days the employee spent on approved leave. */
  leaveDates: ReadonlySet<string>;
  /** Contracted time the leave took off the month: leave days × the working day. */
  leaveMs: number;
  /** Public holidays the employee observes. */
  holidayDates: ReadonlySet<string>;
}

/** How a calendar marks a day: on leave, a holiday, or a finished day that fell short. */
export type DayMark = 'LEAVE' | 'HOLIDAY' | 'SHORT';

const MS_PER_HOUR = 3_600_000;

/** Today's date key (`YYYY-MM-DD`) in `zone` — the day still in progress. */
export function todayKeyIn(zone: string, now: Date = new Date()): string {
  return formatInTimeZone(now, zone, 'yyyy-MM-dd');
}

/** A day's worked time: measured plus approved off-computer time. */
export function workedMsOf(day: WorkedDay | undefined): number {
  return (day?.activeMs ?? 0) + (day?.manualMs ?? 0);
}

/** A duration with its sign, e.g. "-3h 20m" or "+1h 5m"; "0m" when exactly even. */
export function formatSignedHoursMinutes(ms: number): string {
  const text = formatHoursMinutes(Math.abs(ms));
  if (Math.round(ms / 60000) === 0) {
    return text;
  }
  return ms < 0 ? `-${text}` : `+${text}`;
}

/**
 * Compares a range's worked days with its contracted days. A day only counts towards the
 * deficit, and can only be short, once it is over: today is still being worked.
 */
export function monthTarget(
  contract: ExpectedRange,
  worked: readonly WorkedDay[],
  todayKey: string,
): MonthTarget {
  const workedByDate = new Map(worked.map((day) => [day.date, day]));
  const shortDates = new Set<string>();
  const leaveDates = new Set<string>();
  const holidayDates = new Set<string>();
  let expectedMs = 0;
  let expectedSoFarMs = 0;
  for (const day of contract.days) {
    if (day.offReason === 'LEAVE') {
      leaveDates.add(day.date);
    } else if (day.offReason === 'HOLIDAY') {
      holidayDates.add(day.date);
    }
    expectedMs += day.expectedMs;
    if (day.date < todayKey) {
      expectedSoFarMs += day.expectedMs;
      if (workedMsOf(workedByDate.get(day.date)) < day.expectedMs) {
        shortDates.add(day.date);
      }
    }
  }
  const workedMs = worked.reduce((sum, day) => sum + workedMsOf(day), 0);
  return {
    expectedMs,
    expectedSoFarMs,
    workedMs,
    deficitMs: workedMs - expectedSoFarMs,
    shortDates,
    leaveDates,
    leaveMs: leaveDates.size * contract.workHoursPerDay * MS_PER_HOUR,
    holidayDates,
  };
}

/** Each marked day of the range, for a calendar to label. A day carries one mark at most. */
export function dayMarksOf(target: MonthTarget): ReadonlyMap<string, DayMark> {
  const marks = new Map<string, DayMark>();
  for (const date of target.shortDates) {
    marks.set(date, 'SHORT');
  }
  for (const date of target.holidayDates) {
    marks.set(date, 'HOLIDAY');
  }
  for (const date of target.leaveDates) {
    marks.set(date, 'LEAVE');
  }
  return marks;
}
