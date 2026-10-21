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
  /** WEEKEND (the employee's week off), HOLIDAY or LEAVE; null on a working day. */
  offReason?: string | null;
  /** The leave type's code (CL, EL) on leave, the holiday's name on a holiday, else null. */
  offLabel?: string | null;
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
  /** Tracker running with no keyboard, mouse or system activity past the idle threshold. */
  idleMs?: number | null;
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
  /** Days outside the employee's working week. */
  weekOffDates: ReadonlySet<string>;
  /** What to call each off day that has a name: the leave code (CL, EL) or the holiday's name. */
  offLabels: ReadonlyMap<string, string>;
  /** Working days whose worked time (active plus off-computer) met the contracted time. */
  completedDates: ReadonlySet<string>;
  /** Days with approved off-computer work that are neither complete nor finished short. */
  offComputerDates: ReadonlySet<string>;
  /** Measured active time over the range — tracked activity, idle excluded. */
  activeMs: number;
  /** Idle time over the range: the tracker running with nothing happening. Never worked time. */
  idleMs: number;
  /** Approved off-computer work over the range. */
  offComputerMs: number;
  /** Worked time on days outside the working week, kept apart so it is never mistaken for a shortfall. */
  weekOffWorkedMs: number;
}

/**
 * How a calendar marks a day — one status each, the same on the portal, desktop and phone:
 *
 * - COMPLETED: a working day whose worked time (active plus approved off-computer) met its hours.
 * - SHORT: a finished working day below its hours.
 * - LEAVE, HOLIDAY, WEEK_OFF: an off day (a week off keeps its mark even when work was done).
 * - OFF_COMPUTER: approved off-computer work on a day not otherwise marked (e.g. still in progress).
 *
 * A leave or holiday mark's label is in `MonthTarget.offLabels`; an unmarked day is no data/future.
 */
export type DayMark = 'COMPLETED' | 'SHORT' | 'LEAVE' | 'HOLIDAY' | 'WEEK_OFF' | 'OFF_COMPUTER';

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
  const completedDates = new Set<string>();
  const leaveDates = new Set<string>();
  const holidayDates = new Set<string>();
  const weekOffDates = new Set<string>();
  const offLabels = new Map<string, string>();
  let expectedMs = 0;
  let expectedSoFarMs = 0;
  for (const day of contract.days) {
    if (day.offReason === 'LEAVE') {
      leaveDates.add(day.date);
    } else if (day.offReason === 'HOLIDAY') {
      holidayDates.add(day.date);
    } else if (day.offReason === 'WEEKEND') {
      weekOffDates.add(day.date);
    }
    if (day.offLabel) {
      offLabels.set(day.date, day.offLabel);
    }
    expectedMs += day.expectedMs;
    const done = workedMsOf(workedByDate.get(day.date));
    if (day.expectedMs > 0 && done >= day.expectedMs) {
      completedDates.add(day.date);
    }
    if (day.date < todayKey) {
      expectedSoFarMs += day.expectedMs;
      if (done < day.expectedMs) {
        shortDates.add(day.date);
      }
    }
  }
  return {
    expectedMs,
    expectedSoFarMs,
    ...workedTotals(worked, weekOffDates),
    deficitMs: worked.reduce((sum, day) => sum + workedMsOf(day), 0) - expectedSoFarMs,
    shortDates,
    completedDates,
    offComputerDates: new Set(
      worked.filter((day) => (day.manualMs ?? 0) > 0).map((day) => day.date),
    ),
    leaveDates,
    leaveMs: leaveDates.size * contract.workHoursPerDay * MS_PER_HOUR,
    holidayDates,
    weekOffDates,
    offLabels,
  };
}

/** The range's time split into what was worked, what was idle and what fell on a week off. */
function workedTotals(worked: readonly WorkedDay[], weekOffDates: ReadonlySet<string>) {
  let activeMs = 0;
  let idleMs = 0;
  let offComputerMs = 0;
  let weekOffWorkedMs = 0;
  for (const day of worked) {
    activeMs += day.activeMs;
    idleMs += day.idleMs ?? 0;
    offComputerMs += day.manualMs ?? 0;
    if (weekOffDates.has(day.date)) {
      weekOffWorkedMs += workedMsOf(day);
    }
  }
  return { workedMs: activeMs + offComputerMs, activeMs, idleMs, offComputerMs, weekOffWorkedMs };
}

/**
 * Each marked day of the range, for a calendar to label — one mark a day, the stronger winning:
 * leave, then holiday, then week off, then completed, then short, then off-computer work.
 */
export function dayMarksOf(target: MonthTarget): ReadonlyMap<string, DayMark> {
  const marks = new Map<string, DayMark>();
  const layers: ReadonlyArray<[ReadonlySet<string>, DayMark]> = [
    [target.offComputerDates, 'OFF_COMPUTER'],
    [target.shortDates, 'SHORT'],
    [target.completedDates, 'COMPLETED'],
    [target.weekOffDates, 'WEEK_OFF'],
    [target.holidayDates, 'HOLIDAY'],
    [target.leaveDates, 'LEAVE'],
  ];
  for (const [dates, mark] of layers) {
    for (const date of dates) {
      marks.set(date, mark);
    }
  }
  return marks;
}
