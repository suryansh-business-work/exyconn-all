/**
 * `@exyconn/i18n` — everything the portals, the design system and the desktop app need to
 * render themselves in somebody's own language, notation and timezone.
 *
 * Deliberately free of Apollo, MUI and the shell: it is given a locale and its messages and
 * knows nothing about where they came from, which is what lets every layer share it without
 * any of them depending on the others. The shell is what wires it to the portal.
 */
export { I18nProvider, useI18n, useT, type I18nValue } from './I18nProvider';
export { useFormatters } from './useFormatters';
export {
  interpolate,
  translate,
  type Interpolations,
  type Messages,
  type TranslateOptions,
} from './translate';
export {
  DEFAULT_FORMAT_SETTINGS,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatList,
  formatNumber,
  formatPercent,
  formatRelative,
  formatTime,
  type FormatSettings,
} from './format';
export {
  FALLBACK_LOCALE,
  browserLocale,
  canonicalLocale,
  directionOf,
  endonymOf,
  isValidLocale,
  resolveEffectiveLocale,
  type TextDirection,
} from './locale';
export {
  FALLBACK_TIMEZONE,
  deviceTimezone,
  isValidTimezone,
  offsetLabel,
  resolveEffectiveTimezone,
  timezoneOptionLabel,
  timezoneOptions,
} from './timezone';
