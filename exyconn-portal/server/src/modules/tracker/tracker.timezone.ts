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
