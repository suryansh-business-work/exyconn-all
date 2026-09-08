import { formatInTimeZone } from 'date-fns-tz';
import { FALLBACK_LOCALE } from './locale';
import { FALLBACK_TIMEZONE } from './timezone';

/** How a workspace has asked for dates, times, money and where its people are. */
export interface FormatSettings {
  locale: string;
  timezone: string;
  /** date-fns pattern, e.g. `dd MMM yyyy`. */
  dateFormat: string;
  /** date-fns pattern, e.g. `hh:mm a`. */
  timeFormat: string;
  /** ISO 4217 code the portal's money is in. */
  currency: string;
}

export const DEFAULT_FORMAT_SETTINGS: FormatSettings = {
  locale: FALLBACK_LOCALE,
  timezone: FALLBACK_TIMEZONE,
  dateFormat: 'dd MMM yyyy',
  timeFormat: 'hh:mm a',
  currency: 'INR',
};

/** What the caller handed us, as a Date — or null when it is not a usable instant. */
function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Renders an instant in the person's own zone, using the workspace's pattern.
 *
 * Empty string for anything that is not an instant: a table cell reading "Invalid Date" is
 * a bug report, and one reading nothing is a missing value, which is what it actually is.
 */
export function formatDate(
  value: string | number | Date | null | undefined,
  settings: FormatSettings,
): string {
  const date = toDate(value);
  if (!date) {
    return '';
  }
  return formatInTimeZone(date, settings.timezone, settings.dateFormat);
}

/** The same, with the time of day. */
export function formatDateTime(
  value: string | number | Date | null | undefined,
  settings: FormatSettings,
): string {
  const date = toDate(value);
  if (!date) {
    return '';
  }
  return formatInTimeZone(date, settings.timezone, `${settings.dateFormat} ${settings.timeFormat}`);
}

/** Just the clock time, in the person's own zone. */
export function formatTime(
  value: string | number | Date | null | undefined,
  settings: FormatSettings,
): string {
  const date = toDate(value);
  if (!date) {
    return '';
  }
  return formatInTimeZone(date, settings.timezone, settings.timeFormat);
}

/**
 * A number in the person's own notation.
 *
 * Intl, never `toLocaleString()` with no locale: the second one reads the *browser's* locale,
 * so a German employee whose workspace runs in English would see one number grouped their
 * way and the next grouped the other, on the same screen.
 */
export function formatNumber(
  value: number | null | undefined,
  settings: FormatSettings,
  options: Intl.NumberFormatOptions = {},
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '';
  }
  return new Intl.NumberFormat(settings.locale, options).format(value);
}

/** Money, in the workspace's currency and the person's notation. */
export function formatCurrency(
  value: number | null | undefined,
  settings: FormatSettings,
  options: Intl.NumberFormatOptions = {},
): string {
  return formatNumber(value, settings, {
    style: 'currency',
    currency: settings.currency,
    ...options,
  });
}

/** A percentage, where `value` is already 0-100. */
export function formatPercent(
  value: number | null | undefined,
  settings: FormatSettings,
  options: Intl.NumberFormatOptions = {},
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '';
  }
  return new Intl.NumberFormat(settings.locale, {
    style: 'percent',
    maximumFractionDigits: 0,
    ...options,
  }).format(value / 100);
}

/** How long ago, in the person's own language: "3 days ago", "vor 3 Tagen". */
export function formatRelative(
  value: string | number | Date | null | undefined,
  settings: FormatSettings,
  now: Date = new Date(),
): string {
  const date = toDate(value);
  if (!date) {
    return '';
  }
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['day', 86_400],
    ['hour', 3600],
    ['minute', 60],
  ];
  const formatter = new Intl.RelativeTimeFormat(settings.locale, { numeric: 'auto' });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) {
      return formatter.format(Math.trunc(seconds / size), unit);
    }
  }
  return formatter.format(seconds, 'second');
}

/** A list, joined the way the language joins lists: "a, b and c" / "a, b und c". */
export function formatList(items: string[], settings: FormatSettings): string {
  return new Intl.ListFormat(settings.locale, { style: 'long', type: 'conjunction' }).format(items);
}
