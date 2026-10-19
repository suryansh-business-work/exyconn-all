import { UserModel } from '../admin/user.model';
import { HolidayModel } from '../employee/holiday.model';
import { LeaveRequestModel } from '../hr/hr.model';
import { employeePlace, holidaysObservedIn } from '../hrmaster/leave-country';
import { DEFAULT_WORK_HOURS_PER_DAY, WEEKEND_DAYS, workTargetMs } from '../../constants/work';
import { badRequest } from '../../utils/errors';
import { isValidTimezone, zonedDateKey } from './tracker.timezone';

/** Why a day carries no expected hours. */
export type TrackerOffReason = 'WEEKEND' | 'HOLIDAY' | 'LEAVE';

/** One calendar day of the range, with what the employee was contracted to work on it. */
export interface TrackerExpectedDay {
  date: string;
  expectedMs: number;
  offReason: TrackerOffReason | null;
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

/** Days covered by the employee's approved leave in the range, as date keys in `timezone`. */
async function leaveKeys(userId: string, from: Date, to: Date, timezone: string) {
  const rows = await LeaveRequestModel.find({
    employeeId: userId,
    status: 'APPROVED',
    fromDate: { $lt: new Date(to.getTime() + MS_PER_DAY) },
    toDate: { $gte: new Date(from.getTime() - MS_PER_DAY) },
  })
    .select('fromDate toDate')
    .lean();
  return new Set(
    rows.flatMap((row) =>
      keysBetween(zonedDateKey(row.fromDate, timezone), zonedDateKey(row.toDate, timezone)),
    ),
  );
}

/** The day's reason for carrying no hours, or null on a working day. */
function offReasonOf(
  key: string,
  holidays: ReadonlyMap<string, string>,
  leave: ReadonlySet<string>,
): TrackerOffReason | null {
  // Holidays and weekends first: leave spanning one costs no working day, so the month's
  // leave total counts only the days the employee would otherwise have worked.
  if (holidays.has(key)) {
    return 'HOLIDAY';
  }
  if (WEEKEND_DAYS.has(new Date(`${key}T00:00:00Z`).getUTCDay())) {
    return 'WEEKEND';
  }
  return leave.has(key) ? 'LEAVE' : null;
}

/**
 * What an employee was contracted to work on each day of a range: their working day
 * (`workHoursPerDay`) on Monday–Friday, nothing on weekends, the public holidays they
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
    UserModel.findById(userId).select('workHoursPerDay').lean(),
    holidayNames(userId, from, to, timezone),
    leaveKeys(userId, from, to, timezone),
  ]);
  const workHoursPerDay = user?.workHoursPerDay ?? DEFAULT_WORK_HOURS_PER_DAY;
  const targetMs = workTargetMs(workHoursPerDay);
  const days: TrackerExpectedDay[] = keysBetween(
    zonedDateKey(from, timezone),
    zonedDateKey(new Date(to.getTime() - 1), timezone),
  ).map((date) => {
    const offReason = offReasonOf(date, holidays, leave);
    return {
      date,
      offReason,
      expectedMs: offReason === null ? targetMs : 0,
      holidayName: offReason === 'HOLIDAY' ? (holidays.get(date) ?? null) : null,
    };
  });
  return { workHoursPerDay, days };
}

export const trackerExpectedService = { expected };
