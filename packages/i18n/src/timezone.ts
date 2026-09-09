/**
 * Timezone rules, re-exported.
 *
 * The rules themselves live in `@exyconn/time`, which depends on nothing — the portal server
 * and the desktop tracker's main process need the same answers and can import neither React
 * nor date-fns. This file stays so that `@exyconn/i18n`'s own surface does not change.
 */
export {
  FALLBACK_TIMEZONE,
  deviceTimezone,
  isValidTimezone,
  offsetLabel,
  resolveEffectiveTimezone,
  timezoneOptionLabel,
  timezoneOptions,
  type TimezoneCandidates,
} from '@exyconn/time';
