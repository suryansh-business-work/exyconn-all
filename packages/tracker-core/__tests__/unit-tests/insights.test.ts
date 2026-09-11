import { describe, expect, it } from 'vitest';
import {
  activityLevel,
  changePercent,
  dayStripes,
  periodColumns,
  periodTotals,
  periodWindow,
  pointChange,
  relativeChange,
  zonedToday,
} from '../../src/insights';
import type { DayInterval, ReportDay } from '../../src/types';

function interval(startedAt: string, endedAt: string, activityPercent: number): DayInterval {
  return { startedAt, endedAt, activeMs: activityPercent * 1000, idleMs: 0, activityPercent };
}

function day(date: string, activeMs: number, idleMs = 0): ReportDay {
  return { date, activeMs, idleMs, keyCount: 10, mouseCount: 5, sessions: 1 };
}

describe('activityLevel', () => {
  it('splits at 40% and 70%', () => {
    expect(activityLevel(39)).toBe('low');
    expect(activityLevel(40)).toBe('medium');
    expect(activityLevel(69)).toBe('medium');
    expect(activityLevel(70)).toBe('high');
  });
});

describe('dayStripes', () => {
  it('draws nothing for a day without intervals', () => {
    expect(dayStripes([])).toEqual({ stripes: [], span: null, averagePercent: 0 });
  });

  it('places each interval by time, so a break is a gap', () => {
    const { stripes, span } = dayStripes([
      interval('2026-02-03T09:00:00.000Z', '2026-02-03T09:10:00.000Z', 80),
      interval('2026-02-03T09:30:00.000Z', '2026-02-03T09:40:00.000Z', 30),
    ]);
    expect(
      stripes.map(({ offset, width, value, level }) => ({ offset, width, value, level })),
    ).toEqual([
      { offset: 0, width: 0.25, value: 0.8, level: 'high' },
      { offset: 0.75, width: 0.25, value: 0.3, level: 'low' },
    ]);
    expect(span).toEqual({
      startISO: '2026-02-03T09:00:00.000Z',
      midISO: '2026-02-03T09:20:00.000Z',
      endISO: '2026-02-03T09:40:00.000Z',
    });
  });

  it('averages the active share of all the intervals, not of the percentages', () => {
    const quiet = { ...interval('2026-02-03T09:00:00.000Z', '2026-02-03T09:10:00.000Z', 0) };
    const busy = {
      ...interval('2026-02-03T09:10:00.000Z', '2026-02-03T09:20:00.000Z', 100),
      activeMs: 300_000,
    };
    quiet.idleMs = 100_000;
    expect(dayStripes([quiet, busy]).averagePercent).toBe(75);
  });
});

describe('periodWindow', () => {
  it('returns the period ending today and the one before it, in one query range', () => {
    const window = periodWindow(new Date(2026, 1, 14), 7, 'UTC');
    expect(window.current).toEqual([
      '2026-02-08',
      '2026-02-09',
      '2026-02-10',
      '2026-02-11',
      '2026-02-12',
      '2026-02-13',
      '2026-02-14',
    ]);
    expect(window.previous[0]).toBe('2026-02-01');
    expect(window.previous[6]).toBe('2026-02-07');
    expect(window.fromISO).toBe('2026-02-01T00:00:00.000Z');
    expect(window.toISO).toBe('2026-02-15T00:00:00.000Z');
  });
});

describe('zonedToday', () => {
  it('reads today in the employee zone, not the device one', () => {
    const today = zonedToday('Asia/Kolkata', new Date('2026-02-14T20:00:00.000Z'));
    expect([today.getFullYear(), today.getMonth(), today.getDate()]).toEqual([2026, 1, 15]);
  });
});

describe('periodTotals', () => {
  it('sums only the days in the period and counts the tracked ones', () => {
    const totals = periodTotals(
      [day('2026-02-01', 3_600_000, 400_000), day('2026-02-02', 0), day('2026-02-09', 60_000)],
      ['2026-02-01', '2026-02-02'],
    );
    expect(totals).toEqual({
      activeMs: 3_600_000,
      idleMs: 400_000,
      keyCount: 20,
      mouseCount: 10,
      sessions: 2,
      trackedDays: 1,
      activityPercent: 90,
    });
  });
});

describe('changePercent', () => {
  it('is null when the previous period had nothing', () => {
    expect(changePercent(5, 0)).toBeNull();
  });

  it('rounds to one decimal', () => {
    expect(changePercent(342, 358)).toBe(-4.5);
    expect(changePercent(465, 415)).toBe(12);
  });
});

describe('periodColumns', () => {
  it('keeps an untracked day as an empty slot and scales to the longest day', () => {
    const columns = periodColumns(
      [day('2026-02-01', 7_200_000), day('2026-02-03', 3_600_000, 3_600_000)],
      ['2026-02-01', '2026-02-02', '2026-02-03'],
    );
    expect(columns.map(({ value, level, percent }) => ({ value, level, percent }))).toEqual([
      { value: 1, level: 'high', percent: 100 },
      { value: 0, level: null, percent: 0 },
      { value: 0.5, level: 'medium', percent: 50 },
    ]);
    expect(columns[1].offset).toBeCloseTo(1 / 3);
    expect(columns[1].width).toBeCloseTo(1 / 3);
  });
});

describe('relativeChange and pointChange', () => {
  it('signs the change and names its direction', () => {
    expect(relativeChange(465, 415)).toEqual({ text: '+12%', direction: 'up' });
    expect(relativeChange(342, 358)).toEqual({ text: '-4.5%', direction: 'down' });
    expect(relativeChange(3, 0)).toBeNull();
  });

  it('speaks of a percentage change in points', () => {
    expect(pointChange(72, 69)).toEqual({ text: '+3 pts', direction: 'up' });
    expect(pointChange(60, 60)).toEqual({ text: '0 pts', direction: 'flat' });
  });
});
