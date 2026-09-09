import { formatInTimeZone } from 'date-fns-tz';
import { msToHours, type ChartData } from '@exyconn/ui';
import type { TrackerDayBucketData, TrackerDayData, TrackerAppUsageData } from './tracker.types';

/**
 * Shaping tracker data into chart series. Pure — no React, no colour, no formatting decisions
 * beyond which numbers belong together, so every one of these is a table test.
 *
 * Milliseconds are converted to HOURS here rather than in the chart. An axis in milliseconds
 * is unreadable, and rounding at draw time means the chart and its table can disagree.
 */

/** The colours these three always wear. Worked/idle/claimed MEAN something; they are not
 * "series 1, 2 and 3", so they keep their identity across every chart in the tracker. */
export const TIME_SERIES_IDS = {
  active: 'active',
  idle: 'idle',
  manual: 'manual',
} as const;

/**
 * A month of days as worked / idle / off-computer hours.
 *
 * Stacked, because the reader's question is "how much of that day was actually worked" — a
 * part-to-whole reading that a grouped bar makes them do in their head. Days with nothing
 * tracked stay in the axis as gaps rather than being dropped: a missing Tuesday is a fact.
 *
 * Takes no timezone: the portal already bucketed these days in the reader's zone, and
 * re-reading the date key here would shift a day across midnight — the one place it must not
 * move.
 */
export function monthHoursChart(buckets: readonly TrackerDayBucketData[]): ChartData {
  const ordered = [...buckets].sort((a, b) => a.date.localeCompare(b.date));
  return {
    labels: ordered.map((bucket) => bucket.date.slice(8)),
    series: [
      {
        id: TIME_SERIES_IDS.active,
        label: 'Worked',
        values: ordered.map((bucket) => msToHours(bucket.activeMs)),
      },
      {
        id: TIME_SERIES_IDS.idle,
        label: 'Idle',
        values: ordered.map((bucket) => msToHours(bucket.idleMs)),
      },
      {
        id: TIME_SERIES_IDS.manual,
        label: 'Off-computer',
        values: ordered.map((bucket) => msToHours(bucket.manualMs)),
      },
    ],
  };
}

/**
 * One day's activity, hour by hour, from its intervals.
 *
 * Every hour of the working day appears, including the empty ones — a gap at 3pm is the point
 * of the chart, and dropping empty hours would draw a solid day that never happened.
 */
export function dayByHourChart(day: TrackerDayData | undefined, timezone: string): ChartData {
  const worked = new Array<number>(24).fill(0);
  const idle = new Array<number>(24).fill(0);

  for (const interval of day?.intervals ?? []) {
    const at = new Date(interval.startedAt);
    if (Number.isNaN(at.getTime())) {
      continue;
    }
    const hour = Number(formatInTimeZone(at, timezone, 'H'));
    worked[hour] += interval.activeMs;
    idle[hour] += interval.idleMs;
  }

  const touched = worked.map((value, hour) => value + idle[hour] > 0);
  const first = touched.indexOf(true);
  const last = touched.lastIndexOf(true);
  if (first === -1) {
    return { labels: [], series: [] };
  }

  const hours = Array.from({ length: last - first + 1 }, (_unused, offset) => first + offset);
  return {
    labels: hours.map((hour) => `${String(hour).padStart(2, '0')}:00`),
    series: [
      {
        id: TIME_SERIES_IDS.active,
        label: 'Worked',
        values: hours.map((hour) => msToHours(worked[hour])),
      },
      {
        id: TIME_SERIES_IDS.idle,
        label: 'Idle',
        values: hours.map((hour) => msToHours(idle[hour])),
      },
    ],
  };
}

/** How many applications get their own bar before the tail is folded into "Other". */
const APP_LIMIT = 6;

/**
 * The day's applications by time in the foreground.
 *
 * One series, so every bar takes the same colour: these are names, not an ordered scale, and
 * colouring them by their own value would spend the identity channel re-encoding what the bar
 * length already says. The tail folds into "Other" rather than growing more hues.
 */
export function appUsageChart(apps: readonly TrackerAppUsageData[]): ChartData {
  const ranked = [...apps].sort((a, b) => b.durationMs - a.durationMs);
  const top = ranked.slice(0, APP_LIMIT);
  const restMs = ranked.slice(APP_LIMIT).reduce((total, app) => total + app.durationMs, 0);

  const labels = top.map((app) => app.appName);
  const values = top.map((app) => msToHours(app.durationMs));
  if (restMs > 0) {
    labels.push('Other');
    values.push(msToHours(restMs));
  }

  return { labels, series: [{ id: 'app-usage', label: 'In the foreground', values }] };
}

/** The day's worked hours per project — where the time actually went. */
export function projectSplitChart(day: TrackerDayData | undefined): ChartData {
  const byProject = new Map<string, number>();
  for (const session of day?.sessions ?? []) {
    const name = session.projectName || 'Unassigned';
    byProject.set(name, (byProject.get(name) ?? 0) + session.activeMs);
  }

  const ranked = [...byProject.entries()].sort((a, b) => b[1] - a[1]);
  return {
    labels: ranked.map(([name]) => name),
    series: [
      { id: 'project-time', label: 'Worked', values: ranked.map(([, ms]) => msToHours(ms)) },
    ],
  };
}
