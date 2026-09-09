/**
 * Timezone rules — the ONE place that decides whether a zone is real and which zone a
 * person's data is read in.
 *
 * This logic existed in four copies: the i18n package, the portal server, the Tracker portal
 * app and the desktop tracker. They agreed by luck rather than by construction, and the cost
 * of them disagreeing is not cosmetic — a day's work lands on the wrong date, a digest goes
 * out an hour early, a screenshot files itself under yesterday.
 *
 * NOTHING is imported here on purpose. The main process of an Electron app, a plain-node
 * server, a bundled browser app and a design system all need these rules, and the only way
 * one module can serve all four is to depend on nothing but `Intl`.
 */

/** Used when nothing else resolves. UTC is the only zone that is always correct-ish. */
export const FALLBACK_TIMEZONE = 'UTC';

/**
 * Whether `value` is a zone the platform can actually resolve.
 *
 * Deliberately probes `Intl.DateTimeFormat` rather than testing membership of
 * `Intl.supportedValuesOf('timeZone')`: that list is the ICU zone list PRE-canonicalisation,
 * so it holds `Asia/Calcutta` but not `Asia/Kolkata`, and no `UTC` at all — it would reject
 * two of the most common zones our own people are already saved with.
 */
export function isValidTimezone(value: string | null | undefined): value is string {
  if (!value) {
    return false;
  }
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/** The zone this computer is set to, or UTC if it reports something unresolvable. */
export function deviceTimezone(): string {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return isValidTimezone(zone) ? zone : FALLBACK_TIMEZONE;
}

/** The candidates for someone's zone, most specific first. */
export interface TimezoneCandidates {
  /** The zone this person picked for themselves. */
  userTimezone?: string | null;
  /** The workspace-wide default an admin chose. */
  defaultTimezone?: string | null;
  /** The zone the person's own machine reported. */
  deviceTimezone?: string | null;
}

/**
 * The EFFECTIVE zone for a person: their own pick -> the workspace default -> their device
 * -> UTC.
 *
 * Each candidate must be a RESOLVABLE zone to win, not merely present. The device's zone is
 * client-supplied and never validated on the way in, so one machine reporting nonsense would
 * otherwise poison every timestamp that person sees.
 */
export function resolveEffectiveTimezone(candidates: TimezoneCandidates): string {
  const ordered = [candidates.userTimezone, candidates.defaultTimezone, candidates.deviceTimezone];
  return ordered.find(isValidTimezone) ?? FALLBACK_TIMEZONE;
}

/** "UTC+05:30" for a zone right now — offsets move with daylight saving, so `at` matters. */
export function offsetLabel(zone: string, at: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      timeZoneName: 'longOffset',
    }).formatToParts(at);
    return parts.find((part) => part.type === 'timeZoneName')?.value ?? FALLBACK_TIMEZONE;
  } catch {
    return FALLBACK_TIMEZONE;
  }
}

/** How a zone reads in a picker: "Asia/Kolkata (UTC+05:30)". */
export function timezoneOptionLabel(zone: string, at: Date = new Date()): string {
  return `${zone} (${offsetLabel(zone, at)})`;
}

/**
 * Every IANA zone this runtime knows, labelled with its current offset.
 *
 * `current` is unioned in because `Intl.supportedValuesOf` returns the list
 * PRE-canonicalisation: it can omit a zone somebody is already saved with, and a picker whose
 * value is absent from its own options is a picker that renders empty.
 */
export function timezoneOptions(
  current = '',
  at: Date = new Date(),
): Array<{ value: string; label: string }> {
  const names = new Set(Intl.supportedValuesOf('timeZone'));
  names.add(FALLBACK_TIMEZONE);
  if (isValidTimezone(current)) {
    names.add(current);
  }
  return [...names]
    .sort((a, b) => a.localeCompare(b))
    .map((zone) => ({ value: zone, label: timezoneOptionLabel(zone, at) }));
}
