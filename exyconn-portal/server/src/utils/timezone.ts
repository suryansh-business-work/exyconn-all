/**
 * Timezone rules for the whole portal — the ONE place that decides which zone a person's
 * data is read in. The tracker, the calendars, the digests and every rendered timestamp
 * depend on agreeing here; if two of them disagree, a day's work lands on the wrong date.
 */

/** Used when nothing else resolves. UTC is the only zone that is always correct-ish. */
export const FALLBACK_TIMEZONE = 'UTC';

/**
 * Whether `value` is a zone the platform can actually resolve.
 *
 * Deliberately probes `Intl.DateTimeFormat` rather than testing membership of
 * `Intl.supportedValuesOf('timeZone')`: that list is the ICU zone list *pre-canonicalisation*,
 * so on Node 22 it contains `Asia/Calcutta` but NOT `Asia/Kolkata`, and no `UTC` at all —
 * it would reject perfectly valid, modern IANA names.
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

/**
 * Every zone this server can resolve, sorted — the list the phone tracker's picker offers,
 * since Hermes has no `Intl.supportedValuesOf`. The runtime list omits UTC (see above), so it
 * is added.
 */
export function supportedTimezones(): string[] {
  const names = new Set(Intl.supportedValuesOf('timeZone'));
  names.add(FALLBACK_TIMEZONE);
  return [...names].sort((a, b) => a.localeCompare(b));
}

export interface TimezoneCandidates {
  /** The zone this person picked for themselves. */
  employeeTimezone?: string | null;
  /** The workspace-wide default an admin chose. */
  defaultTimezone?: string | null;
  /** The zone the person's own machine reported. */
  deviceTimezone?: string | null;
}

/**
 * The EFFECTIVE zone for a person, in priority order:
 * their own pick -> the workspace default -> their device's zone -> UTC.
 *
 * Each candidate has to be a resolvable zone to win: the device's zone is client-supplied
 * and never validated on the way in, so a machine reporting nonsense must not poison every
 * timestamp the person sees.
 */
export function resolveEffectiveTimezone(candidates: TimezoneCandidates): string {
  const ordered = [
    candidates.employeeTimezone,
    candidates.defaultTimezone,
    candidates.deviceTimezone,
  ];
  return ordered.find(isValidTimezone) ?? FALLBACK_TIMEZONE;
}
