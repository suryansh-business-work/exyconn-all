import { countryName } from '@exyconn/i18n';
import type { Metric } from '@exyconn/shell/components/dashboard/MetricChart';

/** What an empty grouping comes back as from the API. */
const NOT_SET = 'Not set';

/** The tracker's platform codes, as the operating systems people know. */
const PLATFORM_NAMES: Readonly<Record<string, string>> = {
  darwin: 'macOS',
  win32: 'Windows',
  android: 'Android',
  ios: 'iOS',
};

export const count = (value: number): string => Math.round(value).toLocaleString();
export const hours = (value: number): string => `${value.toFixed(1)}h`;
export const percent = (value: number): string => `${Math.round(value)}%`;

/** Country codes as country names; an unset country follows the company's. */
export function withCountryNames(metrics: readonly Metric[], unset: string): Metric[] {
  return metrics.map((metric) => ({
    ...metric,
    label: metric.label === NOT_SET ? unset : countryName(metric.label),
  }));
}

/** Tracker platform codes as operating system names. */
export function withPlatformNames(metrics: readonly Metric[]): Metric[] {
  return metrics.map((metric) => ({
    ...metric,
    label: PLATFORM_NAMES[metric.label] ?? metric.label,
  }));
}
