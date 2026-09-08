/**
 * Timezone rules, in the browser — the same chain the server applies, so a timestamp reads
 * the same wherever it is rendered.
 */

/** Used when nothing else resolves. UTC is the only zone that is always correct-ish. */
export const FALLBACK_TIMEZONE = 'UTC';

/**
 * Whether `value` is a zone the platform can actually resolve.
 *
 * Deliberately probes `Intl.DateTimeFormat` rather than testing membership of
 * `Intl.supportedValuesOf('timeZone')`: that list is the ICU zone list *pre-canonicalisation*,
 * so it can hold `Asia/Calcutta` but not `Asia/Kolkata`, and no `UTC` at all.
 */
export function isValidTimezone(value: string | null | undefined): boolean {
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

/** The zone this computer is set to. */
export function deviceTimezone(): string {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return isValidTimezone(zone) ? zone : FALLBACK_TIMEZONE;
}

/**
 * The EFFECTIVE zone for the person at the screen, in priority order:
 * their own pick -> the workspace default -> this device's zone -> UTC.
 */
export function resolveEffectiveTimezone(candidates: {
  userTimezone?: string | null;
  defaultTimezone?: string | null;
  deviceTimezone?: string | null;
}): string {
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
    return parts.find((part) => part.type === 'timeZoneName')?.value ?? 'UTC';
  } catch {
    return 'UTC';
  }
}

/** How a zone reads in a picker: "Asia/Kolkata (UTC+05:30)". */
export function timezoneOptionLabel(zone: string, at: Date = new Date()): string {
  return `${zone} (${offsetLabel(zone, at)})`;
}

/**
 * Every IANA zone this runtime knows, labelled with its current offset.
 *
 * `current` is unioned in because `Intl.supportedValuesOf` returns the zone list
 * *pre-canonicalisation* — it can hold `Asia/Calcutta` but not the equally valid
 * `Asia/Kolkata` somebody may already have saved, which would show as an empty field.
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
