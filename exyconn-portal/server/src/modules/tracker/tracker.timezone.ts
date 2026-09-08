/**
 * Timezone rules for the tracker.
 *
 * The resolution rules themselves are portal-wide and live in `utils/timezone` — the
 * tracker, the rendered portal and the desktop app all have to agree on which zone a
 * person is in. What stays here is the tracker's own zoned arithmetic: the day key its
 * calendar buckets on, the local hour its digests fire at, and the attendance day start.
 */
export {
  FALLBACK_TIMEZONE,
  isValidTimezone,
  resolveEffectiveTimezone,
  type TimezoneCandidates,
} from '../../utils/timezone';

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
 * The hour (0-23) an instant reads as on a clock in `timeZone`.
 *
 * The scheduled digest is set in local time — "send at 9" means nine where the workspace
 * is, and comparing against a UTC hour would post the morning summary in the afternoon.
 */
export function zonedHour(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    hour12: false,
  }).formatToParts(instant);
  return Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
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
