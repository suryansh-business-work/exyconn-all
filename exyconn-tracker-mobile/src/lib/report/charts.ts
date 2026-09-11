import { activityPercent, type ReportDay } from '@exyconn/tracker-core';
// By path, as the theme's tokens are: the design system's entry imports MUI. These two files
// are pure, and they are the ONE conversion and rounding rule the portal and both trackers plot.
import { formatHours, msToHours } from '@exyconn/ui/src/charts/duration';
import type { ChartData, ValueFormatter } from '@exyconn/ui/src/charts/chart.types';

export type { ChartData, ChartSeries, ValueFormatter } from '@exyconn/ui/src/charts/chart.types';
export { formatHours };

/**
 * Shaping the employee's own tracked time into chart series. Pure — no React, no colour.
 *
 * The desktop app and the portal plot the same facts, so both convert to HOURS at the same
 * point and round the same way: a chart here and a chart in My Tracker showing different
 * numbers for the same Tuesday is worse than either chart alone.
 */

function byDate(days: readonly ReportDay[]): ReportDay[] {
  return days.toSorted((a, b) => a.date.localeCompare(b.date));
}

/**
 * The month, day by day: worked stacked under idle.
 *
 * The employee's own copy of what their manager sees in the portal — which is the point. A
 * tracker that shows you a different shape of your own month than the one being judged is not
 * transparency.
 */
export function monthChart(days: readonly ReportDay[]): ChartData {
  const ordered = byDate(days);
  return {
    labels: ordered.map((day) => day.date.slice(8)),
    series: [
      { id: 'active', label: 'Worked', values: ordered.map((day) => msToHours(day.activeMs)) },
      { id: 'idle', label: 'Idle', values: ordered.map((day) => msToHours(day.idleMs)) },
    ],
  };
}

/**
 * How active each day was, as a line.
 *
 * The bars say how LONG each day was; this says how solid it was, which is the number a
 * manager reads and the one an employee most needs to be able to see for themselves. Drawn
 * from the same `activityPercent` the table and the day chips use, so a day cannot read 62%
 * in one place and 61% in another.
 */
export function activityTrend(days: readonly ReportDay[]): ChartData {
  const ordered = byDate(days);
  return {
    labels: ordered.map((day) => day.date.slice(8)),
    series: [
      {
        id: 'activity',
        label: 'Activity',
        values: ordered.map((day) => activityPercent(day.activeMs, day.idleMs)),
      },
    ],
  };
}

/** Activity is a percentage, and a chart that said "62" would be a chart of nothing. */
export const formatPercent: ValueFormatter = (value) => `${Math.round(value)}%`;

/** True when every series is empty or all-zero — a chart of nothing is worse than a sentence. */
export function isChartEmpty(data: ChartData): boolean {
  if (data.labels.length === 0 || data.series.length === 0) {
    return true;
  }
  return data.series.every((series) => series.values.every((value) => value === 0));
}
