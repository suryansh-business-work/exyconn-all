import { describe, expect, it } from 'vitest';
import type { ReportDay } from '@shared/types';
import { formatHours, monthChart, toHours } from './charts';

const day = (date: string, activeMs: number, idleMs: number): ReportDay => ({
  date,
  activeMs,
  idleMs,
  keyCount: 0,
  mouseCount: 0,
  sessions: 1,
});

const HOUR = 3_600_000;

describe('toHours', () => {
  it('converts milliseconds to hours at one decimal', () => {
    expect(toHours(HOUR * 7.5)).toBe(7.5);
    expect(toHours(0)).toBe(0);
  });

  it('rounds rather than truncating, so a full day does not read as 7.9h', () => {
    expect(toHours(HOUR * 7.98)).toBe(8);
  });
});

describe('formatHours', () => {
  it('writes whole and part hours the way a person says them', () => {
    expect(formatHours(7.5)).toBe('7.5h');
    expect(formatHours(0)).toBe('0h');
  });

  it('drops to minutes below an hour, where a decimal hour stops meaning anything', () => {
    // "0.4h" is a number nobody converts in their head.
    expect(formatHours(0.4)).toBe('24m');
  });
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

  it('keeps a day with nothing tracked, because a missing day is a fact', () => {
    const data = monthChart([day('2026-02-03', 0, 0), day('2026-02-04', HOUR, 0)]);

    expect(data.labels).toEqual(['03', '04']);
    expect(data.series[0].values).toEqual([0, 1]);
  });

  it('has no columns for a month with no days', () => {
    // The series survive with nothing in them; it is the empty label list that tells the card
    // there is nothing to draw, and it says so in words instead of drawing empty axes.
    const data = monthChart([]);

    expect(data.labels).toEqual([]);
    expect(data.series.every((series) => series.values.length === 0)).toBe(true);
  });
});
