/**
 * `@exyconn/time` — zone and locale primitives with ZERO dependencies.
 *
 * Depends on nothing so that everything can depend on it: a bundled browser app, a plain-node
 * server, an Electron main process and the design system all need the same answer to "is this
 * a real timezone" and "which zone does this person read in", and only a module with no
 * imports can serve all four.
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
} from './timezone';
