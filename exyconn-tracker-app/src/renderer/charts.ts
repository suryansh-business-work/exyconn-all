import { msToHours, type ChartData } from '@exyconn/ui';
import type { ReportDay } from '@shared/types';

/**
 * Shaping the employee's own tracked time into chart series. Pure — no React, no colour.
 *
 * The desktop app and the portal plot the same facts, so both convert to HOURS at the same
 * point and round the same way: a chart here and a chart in My Tracker showing different
 * numbers for the same Tuesday is worse than either chart alone.
 */

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
      { id: 'active', label: 'Worked', values: ordered.map((day) => msToHours(day.activeMs)) },
      { id: 'idle', label: 'Idle', values: ordered.map((day) => msToHours(day.idleMs)) },
    ],
  };
}
