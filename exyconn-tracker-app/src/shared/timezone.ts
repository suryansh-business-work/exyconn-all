// Shared between the main and RENDERER processes — must stay free of `process`, `require`
// and every Node builtin, or importing it blanks the renderer window. Zone *formatting*
// (date-fns-tz) is renderer-only and lives in src/renderer/time.ts; this file is only the
// resolution rules, so the main process can resolve a zone without bundling date-fns-tz.

/** The zone used when nothing else resolves. Matches the portal's own FALLBACK_TIMEZONE. */
export const FALLBACK_TIMEZONE = 'UTC';

/**
 * Is this a zone name the runtime can actually resolve?
 *
 * Deliberately an `Intl.DateTimeFormat` probe rather than `Intl.supportedValuesOf('timeZone')
 * .includes(...)`: that list is the PRE-canonicalisation set, so it omits both `UTC` and
 * `Asia/Kolkata` (it carries the legacy `Asia/Calcutta` instead). Checking membership would
 * therefore reject two of the most common zones our employees actually pick. The portal
 * validates the same way, so both ends accept exactly the same names.
 */
export function isValidTimezone(zone: string): boolean {
  if (zone === '') {
    return false;
  }
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
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
 * The zone the app renders in: the employee's own pick (or the admin default, whichever the
 * portal already resolved into `TrackerMe.timezone`), else this device's zone.
 *
 * The portal promises a non-empty, resolvable zone — but it is the far side of a network
 * call, and a zone the runtime cannot resolve would make `formatInTimeZone` throw on every
 * timestamp in the UI. So an unresolvable answer falls back rather than taking the app down.
 */
export function effectiveTimezone(preferred: string | null | undefined): string {
  if (typeof preferred === 'string' && isValidTimezone(preferred)) {
    return preferred;
  }
  return deviceTimezone();
}
