import { UserModel } from '../admin/user.model';
import { HolidayModel } from '../employee/holiday.model';
import { LeaveRequestModel } from '../hr/hr.model';
import { employeePlace, holidaysObservedIn } from '../hrmaster/leave-country';
import { DEFAULT_WORK_HOURS_PER_DAY, workTargetMs } from '../../constants/work';
import { workDaysOf } from '../admin/work-week';
import { badRequest } from '../../utils/errors';
import { isValidTimezone, zonedDateKey } from './tracker.timezone';

/** Why a day carries no expected hours. WEEKEND is the employee's own week off. */
export type TrackerOffReason = 'WEEKEND' | 'HOLIDAY' | 'LEAVE';

/** Why a day is off and what to call it: the leave type's code, the holiday's name, or null. */
export interface TrackerOffDay {
  offReason: TrackerOffReason | null;
  offLabel: string | null;
}

/** One calendar day of the range, with what the employee was contracted to work on it. */
export interface TrackerExpectedDay extends TrackerOffDay {
  date: string;
  expectedMs: number;
  /** The holiday's name on a HOLIDAY day, for the downloadable report's remarks. */
  holidayName: string | null;
}

const MS_PER_DAY = 86_400_000;

/** A month view never needs more; a wider range is a caller asking the server to loop. */
const MAX_RANGE_DAYS = 62;

/** `YYYY-MM-DD` → the next calendar day, in the same shape. */
const nextKey = (key: string): string =>
  new Date(Date.parse(`${key}T00:00:00Z`) + MS_PER_DAY).toISOString().slice(0, 10);

/** Every date key from `first` to `last`, both included. */
function keysBetween(first: string, last: string): string[] {
  const keys: string[] = [];
  for (let key = first; key <= last; key = nextKey(key)) {
    keys.push(key);
  }
  return keys;
}

/** Public holidays the employee observes in the range, by date key in `timezone`. */
async function holidayNames(userId: string, from: Date, to: Date, timezone: string) {
  const rows = await HolidayModel.find({
    ...holidaysObservedIn(await employeePlace(userId)),
    type: 'PUBLIC',
    // A day either side: holidays are stored as a local midnight, which can sit in the UTC
    // day before or after the one the range starts or ends on.
    date: { $gte: new Date(from.getTime() - MS_PER_DAY), $lt: new Date(to.getTime() + MS_PER_DAY) },
  })
    .select('date name')
    .lean();
  return new Map(rows.map((row) => [zonedDateKey(row.date, timezone), row.name]));
}

/** The leave type's code on each day of approved leave in the range, keyed in `timezone`. */
async function leaveCodes(userId: string, from: Date, to: Date, timezone: string) {
  const rows = await LeaveRequestModel.find({
    employeeId: userId,
    status: 'APPROVED',
    fromDate: { $lt: new Date(to.getTime() + MS_PER_DAY) },
    toDate: { $gte: new Date(from.getTime() - MS_PER_DAY) },
  })
    .select('type fromDate toDate')
    .lean();
  return new Map(
    rows.flatMap((row) =>
      keysBetween(zonedDateKey(row.fromDate, timezone), zonedDateKey(row.toDate, timezone)).map(
        (key): [string, string] => [key, row.type],
      ),
    ),
  );
}

/** The day's reason for carrying no hours and its label, or nulls on a working day. */
function offDayOf(
  key: string,
  holidays: ReadonlyMap<string, string>,
  leave: ReadonlyMap<string, string>,
  workDays: ReadonlySet<number>,
): TrackerOffDay {
  // Holidays and weeks off first: leave spanning one costs no working day, so the month's
  // leave total counts only the days the employee would otherwise have worked.
  const holiday = holidays.get(key);
  if (holiday !== undefined) {
    return { offReason: 'HOLIDAY', offLabel: holiday };
  }
  if (!workDays.has(new Date(`${key}T00:00:00Z`).getUTCDay())) {
    return { offReason: 'WEEKEND', offLabel: null };
  }
  const leaveType = leave.get(key);
  if (leaveType !== undefined) {
    return { offReason: 'LEAVE', offLabel: leaveType };
  }
  return { offReason: null, offLabel: null };
}

/**
 * What an employee was contracted to work on each day of a range: their working day
 * (`workHoursPerDay`) on their work days, nothing on their week off, the public holidays they
 * observe, or approved leave. Days are keyed in `timezone`, as the tracker calendar is,
 * so a day's expected and worked figures always describe the same date.
 */
async function expected(userId: string, from: Date, to: Date, timezone: string) {
  if (to.getTime() - from.getTime() > MAX_RANGE_DAYS * MS_PER_DAY || to <= from) {
    badRequest(`The range must be between one and ${MAX_RANGE_DAYS} days`);
  }
  if (!isValidTimezone(timezone)) {
    badRequest(`${timezone} is not a timezone`);
  }
  const [user, holidays, leave] = await Promise.all([
    UserModel.findById(userId).select('workHoursPerDay workDays').lean(),
    holidayNames(userId, from, to, timezone),
    leaveCodes(userId, from, to, timezone),
  ]);
  const workDays = new Set(await workDaysOf(user));
  const workHoursPerDay = user?.workHoursPerDay ?? DEFAULT_WORK_HOURS_PER_DAY;
  const targetMs = workTargetMs(workHoursPerDay);
  const days: TrackerExpectedDay[] = keysBetween(
    zonedDateKey(from, timezone),
    zonedDateKey(new Date(to.getTime() - 1), timezone),
  ).map((date) => {
    const off = offDayOf(date, holidays, leave, workDays);
    return {
      date,
      ...off,
      expectedMs: off.offReason === null ? targetMs : 0,
      holidayName: off.offReason === 'HOLIDAY' ? off.offLabel : null,
    };
  });
  return { workHoursPerDay, days };
}

/**
 * Whether the employee's CURRENT local day is off, by the same rules as the expected hours —
 * so the tracker refuses exactly the days the calendar shows as off.
 */
async function offDayToday(userId: string, timezone: string): Promise<TrackerOffDay> {
  const now = new Date();
  const { days } = await expected(userId, now, new Date(now.getTime() + 1), timezone);
  return { offReason: days[0].offReason, offLabel: days[0].offLabel };
}

export const trackerExpectedService = { expected, offDayToday };
