import { describe, expect, it } from 'vitest';
import type { ReportDay } from '@exyconn/tracker-core';
import {
  activityTrend,
  formatHours,
  formatPercent,
  isChartEmpty,
  monthChart,
} from '../../../src/lib/report/charts';

const HOUR = 3_600_000;

const day = (date: string, activeMs: number, idleMs: number): ReportDay => ({
  date,
  activeMs,
  idleMs,
  keyCount: 0,
  mouseCount: 0,
  sessions: 1,
});

describe('monthChart', () => {
  it('plots worked and idle as two series over the month’s days', () => {
    const data = monthChart([day('2026-02-03', HOUR * 6, HOUR * 2)]);

    expect(data.labels).toEqual(['03']);
    expect(data.series.map((series) => series.label)).toEqual(['Worked', 'Idle']);
    expect(data.series[0].values).toEqual([6]);
    expect(data.series[1].values).toEqual([2]);
  });

  it('orders the columns by date whatever order the portal returned', () => {
    const data = monthChart([day('2026-02-11', HOUR, 0), day('2026-02-02', HOUR * 2, 0)]);

    expect(data.labels).toEqual(['02', '11']);
    expect(data.series[0].values).toEqual([2, 1]);
  });

  it('rounds to the portal’s one decimal, so a full day does not read as 7.9h', () => {
    expect(monthChart([day('2026-02-03', HOUR * 7.98, 0)]).series[0].values).toEqual([8]);
  });

  it('keeps a day with nothing tracked, because a missing day is a fact', () => {
    const data = monthChart([day('2026-02-03', 0, 0), day('2026-02-04', HOUR, 0)]);

    expect(data.labels).toEqual(['03', '04']);
    expect(data.series[0].values).toEqual([0, 1]);
  });

  it('has no columns for a month with no days', () => {
    const data = monthChart([]);

    expect(data.labels).toEqual([]);
    expect(data.series.every((series) => series.values.length === 0)).toBe(true);
  });
});

describe('activityTrend', () => {
  it('plots the share of each day that was active, not its length', () => {
    expect(activityTrend([day('2026-02-03', HOUR * 6, HOUR * 2)]).series[0].values).toEqual([75]);
  });

  it('orders the line by date whatever order the portal returned', () => {
    const data = activityTrend([day('2026-02-11', HOUR, 0), day('2026-02-02', HOUR, HOUR)]);

    expect(data.labels).toEqual(['02', '11']);
    expect(data.series[0].values).toEqual([50, 100]);
  });

  it('reads a day with nothing tracked as 0%, never as a gap in the line', () => {
    expect(activityTrend([day('2026-02-03', 0, 0)]).series[0].values).toEqual([0]);
  });
});

describe('formatters', () => {
  it('writes hours the way a person says them, minutes below the hour', () => {
    expect(formatHours(7.5)).toBe('7.5h');
    expect(formatHours(0.4)).toBe('24m');
  });

  it('writes activity as a whole percentage', () => {
    expect(formatPercent(61.6)).toBe('62%');
  });
});

describe('isChartEmpty', () => {
  it('is empty with no days, or with days that are all zero', () => {
    expect(isChartEmpty(monthChart([]))).toBe(true);
    expect(isChartEmpty(monthChart([day('2026-02-03', 0, 0)]))).toBe(true);
  });

  it('is not empty once any day has time on it', () => {
    expect(isChartEmpty(monthChart([day('2026-02-03', 0, HOUR)]))).toBe(false);
  });
});
