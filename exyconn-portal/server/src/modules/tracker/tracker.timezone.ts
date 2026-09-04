/**
 * Timezone rules for the tracker — the ONE place that decides which zone an employee's
 * hours are read in. The portal, the desktop app and the calendar aggregation all depend
 * on agreeing here; if two of them disagree, a day's work lands on the wrong date.
 */

/** Used when nothing else resolves. UTC is the only zone that is always correct-ish. */
export const FALLBACK_TIMEZONE = 'UTC';

/**
 * Whether `value` is a zone the platform can actually resolve.
 *
 * Deliberately probes `Intl.DateTimeFormat` rather than testing membership of
 * `Intl.supportedValuesOf('timeZone')`: that list is the ICU zone list *pre-canonicalisation*,
 * so on Node 22 it contains `Asia/Calcutta` but NOT `Asia/Kolkata`, and no `UTC` at all —
 * it would reject perfectly valid, modern IANA names (see the note in the PR description).
 */
export function isValidTimezone(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }
  try {
    Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export interface TimezoneCandidates {
  /** The zone the employee picked for themselves in the desktop app. */
  employeeTimezone?: string | null;
  /** The admin-chosen default from tracker settings. */
  defaultTimezone?: string | null;
  /** The zone the employee's machine reported when it signed in. */
  deviceTimezone?: string | null;
}

/**
 * The EFFECTIVE zone for an employee, in priority order:
 * their own pick -> the admin default -> their device's zone -> UTC.
 *
 * Each candidate has to be a resolvable zone to win: the device's zone is client-supplied
 * and never validated on the way in, so a machine reporting nonsense must not poison every
 * timestamp the employee sees.
 */
export function resolveEffectiveTimezone(candidates: TimezoneCandidates): string {
  const ordered = [
    candidates.employeeTimezone,
    candidates.defaultTimezone,
    candidates.deviceTimezone,
  ];
  return ordered.find(isValidTimezone) ?? FALLBACK_TIMEZONE;
}

/** The date parts an instant reads as on a clock in `timeZone`. */
function zonedParts(instant: Date, timeZone: string): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? '0');
  return { year: read('year'), month: read('month'), day: read('day') };
}

/**
 * The calendar date `instant` falls on in `timeZone`, as `YYYY-MM-DD`.
 *
 * The same format Mongo's `$dateToString` produces for the calendar aggregation, so a day
 * bucket from the database and a day computed here are comparable strings.
 */
export function zonedDateKey(instant: Date, timeZone: string): string {
  const { year, month, day } = zonedParts(instant, timeZone);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Midnight UTC of the calendar date `instant` falls on in `timeZone`.
 *
 * This is the shape attendance is keyed on (HrService normalises every attendance date to
 * midnight UTC), so an employee in Kolkata marking attendance at 00:30 local gets the day
 * they are actually in rather than the UTC day that is still yesterday.
 */
export function zonedDayStartUtc(instant: Date, timeZone: string): Date {
  const { year, month, day } = zonedParts(instant, timeZone);
  return new Date(Date.UTC(year, month - 1, day));
}
