import { describe, expect, it } from 'vitest';
import {
  appUsageChart,
  dayByHourChart,
  monthHoursChart,
  projectSplitChart,
} from '@/pages/tracker-view/tracker.charts';

const HOUR = 3_600_000;

const bucket = (date: string, activeMs: number, idleMs: number, manualMs = 0) => ({
  date,
  activeMs,
  idleMs,
  manualMs,
  keyCount: 0,
  mouseCount: 0,
  sessions: 1,
});

const interval = (startedAt: string, activeMs: number, idleMs: number) => ({
  id: startedAt,
  sessionId: 's1',
  startedAt,
  endedAt: startedAt,
  keyCount: 0,
  mouseCount: 0,
  activeMs,
  idleMs,
  activityPercent: 0,
});

const session = (projectName: string, activeMs: number) => ({
  id: projectName,
  startedAt: '',
  endedAt: null,
  status: 'stopped',
  projectId: projectName,
  projectName,
  activeMs,
  idleMs: 0,
  keyCount: 0,
  mouseCount: 0,
});

/** The day shape the charts read, with only the fields each one actually touches. */
const day = (parts: Partial<Parameters<typeof dayByHourChart>[0] & object>) =>
  ({ intervals: [], sessions: [], appUsage: [], screenshots: [], ...parts }) as never;

describe('monthHoursChart', () => {
  it('splits each day into worked, idle and off-computer', () => {
    const data = monthHoursChart([bucket('2026-02-03', HOUR * 6, HOUR * 2, HOUR)]);

    expect(data.labels).toEqual(['03']);
    expect(data.series.map((s) => s.label)).toEqual(['Worked', 'Idle', 'Off-computer']);
    expect(data.series.map((s) => s.values[0])).toEqual([6, 2, 1]);
  });

  it('orders days by date whatever order the portal returned', () => {
    const data = monthHoursChart([bucket('2026-02-11', HOUR, 0), bucket('2026-02-02', 0, HOUR)]);

    expect(data.labels).toEqual(['02', '11']);
  });

  it('gives every series a stable id, so a colour follows the entity not its row', () => {
    const ids = monthHoursChart([bucket('2026-02-03', HOUR, 0)]).series.map((s) => s.id);

    expect(ids).toEqual(['active', 'idle', 'manual']);
  });
});

describe('dayByHourChart', () => {
  it('buckets intervals into the hour they started in, in the reader’s zone', () => {
    // 04:30 UTC is 10:00 in Kolkata — the hour the employee actually worked.
    const data = dayByHourChart(
      day({ intervals: [interval('2026-02-03T04:30:00.000Z', HOUR, 0)] }),
      'Asia/Kolkata',
    );

    expect(data.labels).toEqual(['10:00']);
  });

  it('keeps the empty hours between the first and last — a gap at 3pm is the point', () => {
    const data = dayByHourChart(
      day({
        intervals: [
          interval('2026-02-03T09:00:00.000Z', HOUR, 0),
          interval('2026-02-03T12:00:00.000Z', HOUR, 0),
        ],
      }),
      'UTC',
    );

    expect(data.labels).toEqual(['09:00', '10:00', '11:00', '12:00']);
    expect(data.series[0].values).toEqual([1, 0, 0, 1]);
  });

  it('does not pad the day out to 24 empty hours around the work', () => {
    const data = dayByHourChart(
      day({ intervals: [interval('2026-02-03T09:00:00.000Z', HOUR, 0)] }),
      'UTC',
    );

    expect(data.labels).toEqual(['09:00']);
  });

  it('has nothing to plot for a day with no intervals', () => {
    expect(dayByHourChart(day({}), 'UTC')).toEqual({ labels: [], series: [] });
  });

  it('ignores an interval whose timestamp will not parse rather than bucketing it at midnight', () => {
    const data = dayByHourChart(day({ intervals: [interval('not-a-date', HOUR, 0)] }), 'UTC');

    expect(data.labels).toEqual([]);
  });
});

describe('appUsageChart', () => {
  it('ranks applications by time and plots them as ONE series', () => {
    const data = appUsageChart([
      { appName: 'Slack', durationMs: HOUR },
      { appName: 'VS Code', durationMs: HOUR * 3 },
    ]);

    expect(data.labels).toEqual(['VS Code', 'Slack']);
    // One series, so every bar takes the same colour: these are names, not a value scale.
    expect(data.series).toHaveLength(1);
    expect(data.series[0].values).toEqual([3, 1]);
  });

  it('folds the tail into "Other" instead of growing a ninth colour', () => {
    const apps = Array.from({ length: 9 }, (_unused, index) => ({
      appName: `App ${index}`,
      durationMs: HOUR * (9 - index),
    }));

    const data = appUsageChart(apps);

    expect(data.labels).toHaveLength(7);
    expect(data.labels.at(-1)).toBe('Other');
    // Apps 6, 7 and 8 — 3h + 2h + 1h.
    expect(data.series[0].values.at(-1)).toBe(6);
  });

  it('leaves "Other" off when nothing was folded into it', () => {
    const data = appUsageChart([{ appName: 'Slack', durationMs: HOUR }]);

    expect(data.labels).toEqual(['Slack']);
  });
});

describe('projectSplitChart', () => {
  it('adds up every session booked to the same project', () => {
    const data = projectSplitChart(
      day({ sessions: [session('Apollo', HOUR), session('Apollo', HOUR * 2)] }),
    );

    expect(data.labels).toEqual(['Apollo']);
    expect(data.series[0].values).toEqual([3]);
  });

  it('files a session with no project under "Unassigned" rather than an empty label', () => {
    const data = projectSplitChart(day({ sessions: [session('', HOUR)] }));

    expect(data.labels).toEqual(['Unassigned']);
  });

  it('ranks projects by time worked', () => {
    const data = projectSplitChart(
      day({ sessions: [session('Small', HOUR), session('Big', HOUR * 5)] }),
    );

    expect(data.labels).toEqual(['Big', 'Small']);
  });
});
