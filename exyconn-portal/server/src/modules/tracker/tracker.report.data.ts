import { UserModel } from '../admin/user.model';
import { trackerEarningsService } from './tracker.earnings.service';
import { figuresByDay } from './tracker.expected.report';
import { trackerExpectedService, type TrackerExpectedDay } from './tracker.expected.service';
import { zonedDateKey } from './tracker.timezone';

/**
 * A day's status, by the same rules tracker-core's `dayMarksOf` applies on the portal, the
 * desktop and the phone (the server cannot import that package, so the rule is mirrored here
 * and the tests hold the two to the same cases): leave, holiday and week off win; then a
 * working day is COMPLETED once worked time (active plus approved off-computer) meets its
 * hours, SHORT once it is over below them, and OFF_COMPUTER while it carries approved
 * off-computer work but is neither.
 */
export type ReportDayStatus =
  'COMPLETED' | 'SHORT' | 'LEAVE' | 'HOLIDAY' | 'WEEK_OFF' | 'OFF_COMPUTER' | 'NONE';

const OFF_STATUS: Readonly<Record<string, ReportDayStatus>> = {
  LEAVE: 'LEAVE',
  HOLIDAY: 'HOLIDAY',
  WEEKEND: 'WEEK_OFF',
};

export function dayStatusOf(
  day: Pick<TrackerExpectedDay, 'date' | 'expectedMs' | 'offReason'>,
  workedMs: number,
  manualMs: number,
  todayKey: string,
): ReportDayStatus {
  if (day.offReason) {
    return OFF_STATUS[day.offReason] ?? 'NONE';
  }
  if (day.expectedMs > 0 && workedMs >= day.expectedMs) {
    return 'COMPLETED';
  }
  if (day.date < todayKey && workedMs < day.expectedMs) {
    return 'SHORT';
  }
  return manualMs > 0 ? 'OFF_COMPUTER' : 'NONE';
}

/** One day of the report. Every duration is in milliseconds. */
export interface ReportDay {
  date: string;
  status: ReportDayStatus;
  /** The leave code or the holiday's name, when the day has one. */
  label: string;
  expectedMs: number;
  activeMs: number;
  idleMs: number;
  offComputerMs: number;
  /** Active plus approved off-computer time; idle time never counts. */
  workedMs: number;
  activityPercent: number;
}

export interface ReportTotals {
  expectedMs: number;
  /** Contracted time over the days already over — what the deficit is measured against. */
  expectedSoFarMs: number;
  workedMs: number;
  activeMs: number;
  idleMs: number;
  offComputerMs: number;
  /** Worked time on days outside the working week, shown apart. */
  weekOffWorkedMs: number;
  /** Worked time over the range minus the expected time elapsed: negative while behind. */
  deficitMs: number;
  leaveDays: number;
  leaveMs: number;
}

/** What hourly pay the worked time earns; null amount for a salaried employee. */
export interface ReportEarnings {
  payType: string;
  rate: number;
  currency: string;
  amount: number | null;
}

export interface HoursReport {
  employee: { id: string; name: string; email: string };
  from: string;
  to: string;
  timezone: string;
  workHoursPerDay: number;
  days: ReportDay[];
  totals: ReportTotals;
  earnings: ReportEarnings;
}

const MS_PER_HOUR = 3_600_000;

const percent = (activeMs: number, idleMs: number) => {
  const total = activeMs + idleMs;
  return total > 0 ? Math.round((activeMs / total) * 100) : 0;
};

/** Adds a day onto the running totals. */
function addDay(totals: ReportTotals, day: ReportDay, over: boolean): void {
  totals.expectedMs += day.expectedMs;
  totals.expectedSoFarMs += over ? day.expectedMs : 0;
  totals.workedMs += day.workedMs;
  totals.activeMs += day.activeMs;
  totals.idleMs += day.idleMs;
  totals.offComputerMs += day.offComputerMs;
  totals.weekOffWorkedMs += day.status === 'WEEK_OFF' ? day.workedMs : 0;
  totals.leaveDays += day.status === 'LEAVE' ? 1 : 0;
}

/**
 * One employee's hours over a range — every day's status and figures, the totals and what the
 * hours earn — read from the same calendar and contract the screens use, so the PDF and the
 * emails can never tell a different story from the portal.
 */
export async function buildHoursReport(
  userId: string,
  from: Date,
  to: Date,
  timezone: string,
  now: Date = new Date(),
): Promise<HoursReport> {
  const fromText = from.toISOString();
  const toText = to.toISOString();
  const [contract, figures, user, earnings] = await Promise.all([
    trackerExpectedService.expected(userId, from, to, timezone),
    figuresByDay(userId, from, to, timezone),
    UserModel.findById(userId).select('name email').lean(),
    trackerEarningsService.earnings(userId, fromText, toText),
  ]);
  const todayKey = zonedDateKey(now, timezone);
  const totals: ReportTotals = {
    expectedMs: 0,
    expectedSoFarMs: 0,
    workedMs: 0,
    activeMs: 0,
    idleMs: 0,
    offComputerMs: 0,
    weekOffWorkedMs: 0,
    deficitMs: 0,
    leaveDays: 0,
    leaveMs: 0,
  };
  const days = contract.days.map((expected): ReportDay => {
    const done = figures.get(expected.date);
    const activeMs = done?.activeMs ?? 0;
    const workedMs = done?.loggedMs ?? 0;
    const offComputerMs = workedMs - activeMs;
    const day: ReportDay = {
      date: expected.date,
      status: dayStatusOf(expected, workedMs, offComputerMs, todayKey),
      label: expected.offLabel ?? '',
      expectedMs: expected.expectedMs,
      activeMs,
      idleMs: done?.idleMs ?? 0,
      offComputerMs,
      workedMs,
      activityPercent: percent(activeMs, done?.idleMs ?? 0),
    };
    addDay(totals, day, expected.date < todayKey);
    return day;
  });
  totals.deficitMs = totals.workedMs - totals.expectedSoFarMs;
  totals.leaveMs = totals.leaveDays * contract.workHoursPerDay * MS_PER_HOUR;
  return {
    employee: { id: userId, name: user?.name ?? '', email: user?.email ?? '' },
    from: fromText,
    to: toText,
    timezone,
    workHoursPerDay: contract.workHoursPerDay,
    days,
    totals,
    earnings: {
      payType: earnings.payType,
      rate: earnings.rate,
      currency: earnings.currency,
      amount: earnings.amount,
    },
  };
}
