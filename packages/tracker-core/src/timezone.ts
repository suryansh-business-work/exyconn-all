/**
 * Timezone rules for the desktop tracker, re-exported from `@exyconn/time`.
 *
 * Shared between the main and RENDERER processes, so it must stay free of `process`,
 * `require` and every Node builtin — which is exactly why the rules live in a package that
 * imports nothing at all. Zone FORMATTING (date-fns-tz) is renderer-only and lives in
 * src/renderer/time.ts.
 *
 * `effectiveTimezone` is the app's own one-argument shape: the portal has already collapsed
 * the employee's pick and the house default into a single answer by the time it reaches here,
 * so the only fallback left is this device's own zone.
 */
import { deviceTimezone, isValidTimezone } from '@exyconn/time';

export { FALLBACK_TIMEZONE, deviceTimezone, isValidTimezone } from '@exyconn/time';

/**
 * The zone the app renders in: whatever the portal resolved for this employee, else this
 * device's zone.
 *
 * The portal promises a non-empty, resolvable zone — but it is the far side of a network
 * call, and a zone this runtime cannot resolve would make every timestamp in the UI throw.
 */
export function effectiveTimezone(preferred: string | null | undefined): string {
  return isValidTimezone(preferred) ? preferred : deviceTimezone();
}
