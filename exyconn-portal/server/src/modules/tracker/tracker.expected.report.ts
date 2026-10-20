import { UserModel } from '../admin/user.model';
import { writeTableFile, type ExportCell, type Sheet } from '../table-transfer/tableFiles';
import { TrackerScreenshotModel } from './models';
import { trackerAdminService } from './tracker.admin.service';
import { trackerExpectedService, type TrackerExpectedDay } from './tracker.expected.service';
import { zonedDateKey } from './tracker.timezone';

const MS_PER_HOUR = 3_600_000;

const HEADERS = [
  'Date',
  'Expected hrs',
  'Logged hrs',
  'Deficit',
  'Activity %',
  'Screenshots',
  'Mouse clicks',
  'Keystrokes',
  'Remarks',
];

/** What the Remarks column says about a day that carries no hours. */
const OFF_REMARKS: Readonly<Record<string, string>> = {
  WEEKEND: 'Week off',
  LEAVE: 'On leave',
};

/** One day's measured figures; a day with nothing tracked reads as all zeros. */
interface DayFigures {
  loggedMs: number;
  activeMs: number;
  idleMs: number;
  mouseCount: number;
  keyCount: number;
  screenshots: number;
}

const NOTHING: DayFigures = {
  loggedMs: 0,
  activeMs: 0,
  idleMs: 0,
  mouseCount: 0,
  keyCount: 0,
  screenshots: 0,
};

/** Milliseconds as hours, to two places, kept numeric so the sheet can add them up. */
const hours = (ms: number): number => Math.round((ms / MS_PER_HOUR) * 100) / 100;

/** Active share of tracked time as a whole percentage; 0 when nothing was tracked. */
function activityPercent({ activeMs, idleMs }: DayFigures): number {
  const total = activeMs + idleMs;
  return total > 0 ? Math.round((activeMs / total) * 100) : 0;
}

/** The day's remark: why it carries no hours, or how it went against them. */
function remarkOf(day: TrackerExpectedDay, loggedMs: number, todayKey: string): string {
  if (day.offReason === 'HOLIDAY') {
    return day.holidayName ? `Holiday: ${day.holidayName}` : 'Holiday';
  }
  if (day.offReason !== null) {
    return OFF_REMARKS[day.offReason];
  }
  if (day.date === todayKey) {
    return 'In progress';
  }
  if (day.date > todayKey) {
    return 'Upcoming';
  }
  return loggedMs < day.expectedMs ? 'Below expected hours' : 'Met expected hours';
}

/** Screenshots captured per day in the range, keyed in `timezone` like the calendar. */
async function screenshotsByDay(userId: string, from: Date, to: Date, timezone: string) {
  const rows = await TrackerScreenshotModel.aggregate<{ date: string; count: number }>([
    { $match: { userId, capturedAt: { $gte: from, $lt: to } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$capturedAt', timezone } },
        count: { $sum: 1 },
      },
    },
    { $project: { _id: 0, date: '$_id', count: 1 } },
  ]);
  return new Map(rows.map((row) => [row.date, row.count]));
}

/** Every day's measured figures, merged from the calendar buckets and the screenshot counts. */
export async function figuresByDay(userId: string, from: Date, to: Date, timezone: string) {
  const [buckets, shots] = await Promise.all([
    trackerAdminService.calendar(userId, from, to, timezone),
    screenshotsByDay(userId, from, to, timezone),
  ]);
  const figures = new Map<string, DayFigures>();
  for (const day of buckets) {
    figures.set(day.date, {
      loggedMs: day.activeMs + day.manualMs,
      activeMs: day.activeMs,
      idleMs: day.idleMs,
      mouseCount: day.mouseCount,
      keyCount: day.keyCount,
      screenshots: shots.get(day.date) ?? 0,
    });
  }
  for (const [date, count] of shots) {
    if (!figures.has(date)) {
      figures.set(date, { ...NOTHING, screenshots: count });
    }
  }
  return figures;
}

/** Adds one day's figures onto the running total. */
function addInto(total: DayFigures, day: DayFigures): void {
  total.loggedMs += day.loggedMs;
  total.activeMs += day.activeMs;
  total.idleMs += day.idleMs;
  total.mouseCount += day.mouseCount;
  total.keyCount += day.keyCount;
  total.screenshots += day.screenshots;
}

/** The measured columns, in header order, after the deficit. */
const measured = (day: DayFigures): ExportCell[] => [
  activityPercent(day),
  day.screenshots,
  day.mouseCount,
  day.keyCount,
];

/**
 * One employee's month as an XLSX: every day with its contracted hours, the hours logged
 * (tracked plus approved off-computer time), the deficit — negative while behind — the
 * activity, screenshots, clicks and keystrokes, and a remark. Approved leave takes its days
 * off the expected hours, and the totals row says how much was taken. A day only carries a deficit
 * once it is over, so today and later days leave it blank, and the totals row's deficit is
 * measured against the days already over.
 */
async function build(userId: string, from: Date, to: Date, timezone: string) {
  const [contract, figures, user] = await Promise.all([
    trackerExpectedService.expected(userId, from, to, timezone),
    figuresByDay(userId, from, to, timezone),
    UserModel.findById(userId).select('name').lean(),
  ]);
  const todayKey = zonedDateKey(new Date(), timezone);
  const total: DayFigures = { ...NOTHING };
  let expectedMs = 0;
  let expectedSoFarMs = 0;

  const rows: ExportCell[][] = contract.days.map((day) => {
    const done = figures.get(day.date) ?? NOTHING;
    const over = day.date < todayKey;
    addInto(total, done);
    expectedMs += day.expectedMs;
    expectedSoFarMs += over ? day.expectedMs : 0;
    return [
      day.date,
      hours(day.expectedMs),
      hours(done.loggedMs),
      over ? hours(done.loggedMs - day.expectedMs) : '',
      ...measured(done),
      remarkOf(day, done.loggedMs, todayKey),
    ];
  });
  const leaveDays = contract.days.filter((day) => day.offReason === 'LEAVE').length;
  const leaveHours = leaveDays * contract.workHoursPerDay;
  rows.push([
    'Total',
    hours(expectedMs),
    hours(total.loggedMs),
    hours(total.loggedMs - expectedSoFarMs),
    ...measured(total),
    `Leave: ${leaveDays} days (${leaveHours} hrs off expected). Deficit against ${hours(expectedSoFarMs)} hrs expected so far`,
  ]);

  const month = contract.days[0]?.date.slice(0, 7) ?? '';
  const sheet: Sheet = { name: `Hours ${month}`, headers: HEADERS, rows };
  // `fileNameFor` stamps the day it was generated, so the month leads: name-2026-09-hours-<today>.
  return writeTableFile('XLSX', `${user?.name ?? ''} ${month} hours`, [sheet]);
}

export const trackerExpectedReport = { build };
