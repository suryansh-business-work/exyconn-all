import type { ChartData } from '@exyconn/ui';
import type { ReportDay } from '@shared/types';

/**
 * Shaping the employee's own tracked time into chart series. Pure — no React, no colour.
 *
 * The desktop app and the portal plot the same facts, so both convert to HOURS at the same
 * point and round the same way: a chart here and a chart in My Tracker showing different
 * numbers for the same Tuesday is worse than either chart alone.
 */

/** Milliseconds as hours, to one decimal — the unit every tracker chart is plotted in. */
export function toHours(ms: number): number {
  return Math.round((ms / 3_600_000) * 10) / 10;
}

/** "6.5h", or "45m" below the hour, where a decimal hour stops being readable. */
export function formatHours(hours: number): string {
  if (hours === 0) {
    return '0h';
  }
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  }
  return `${Math.round(hours * 10) / 10}h`;
}

/**
 * The month, day by day: worked stacked under idle.
 *
 * The employee's own copy of what their manager sees in the portal — which is the point. A
 * tracker that shows you a different shape of your own month than the one being judged is not
 * transparency.
 */
export function monthChart(days: readonly ReportDay[]): ChartData {
  const ordered = [...days].sort((a, b) => a.date.localeCompare(b.date));
  return {
    labels: ordered.map((day) => day.date.slice(8)),
    series: [
      { id: 'active', label: 'Worked', values: ordered.map((day) => toHours(day.activeMs)) },
      { id: 'idle', label: 'Idle', values: ordered.map((day) => toHours(day.idleMs)) },
    ],
  };
}
