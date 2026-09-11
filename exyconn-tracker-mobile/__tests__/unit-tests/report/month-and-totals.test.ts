import { describe, expect, it } from 'vitest';
import type { DayDetail, ReportDay } from '@exyconn/tracker-core';
import { canGoForward, monthKeyOf, shiftMonth, startOfMonth } from '../../../src/lib/report/month';
import {
  dayRowLabel,
  dayTotals,
  inputSummary,
  sumReport,
  summaries,
} from '../../../src/lib/report/totals';

const HOUR = 3_600_000;

const reportDay = (date: string, activeMs: number, idleMs: number): ReportDay => ({
  date,
  activeMs,
  idleMs,
  keyCount: 1200,
  mouseCount: 30,
  sessions: 2,
});

describe('month helpers', () => {
  it('names the month for a file, zero-padded so it sorts', () => {
    expect(monthKeyOf(new Date(2026, 1, 17))).toBe('2026-02');
  });

  it('pages across a year boundary', () => {
    expect(shiftMonth(new Date(2026, 0, 1), -1)).toEqual(new Date(2025, 11, 1));
    expect(startOfMonth(new Date(2026, 1, 17))).toEqual(new Date(2026, 1, 1));
  });

  it('never pages into a month that has not started', () => {
    const today = new Date(2026, 1, 17);
    expect(canGoForward(new Date(2026, 0, 1), today)).toBe(true);
    expect(canGoForward(new Date(2026, 1, 1), today)).toBe(false);
  });
});

describe('totals', () => {
  it('adds the month up and reads activity off the sums', () => {
    const totals = sumReport([
      reportDay('2026-02-02', HOUR * 6, HOUR * 2),
      reportDay('2026-02-03', HOUR * 2, 0),
    ]);
    expect(totals).toEqual({ activeMs: HOUR * 8, idleMs: HOUR * 2, activityPercent: 80 });
    expect(summaries(totals).map((item) => item.value)).toEqual(['8h 0m', '2h 0m', '80%']);
  });

  it('reads an empty month as zero, not as NaN', () => {
    expect(sumReport([]).activityPercent).toBe(0);
  });

  it('shapes one day like the month, with its input counts', () => {
    const detail: DayDetail = {
      activeMs: HOUR * 3,
      idleMs: HOUR,
      keyCount: 1200,
      mouseCount: 30,
      sessions: 2,
      screenshots: [],
      intervals: [],
    };
    expect(dayTotals(detail).activityPercent).toBe(75);
    expect(inputSummary(detail)).toBe(`${(1200).toLocaleString()} keys · 30 clicks · 2 sessions`);
  });

  it('reads a table row as one sentence', () => {
    expect(dayRowLabel(reportDay('2026-02-03', HOUR * 6, HOUR * 2))).toBe(
      `Tue 3 Feb, worked 6h 0m, idle 2h 0m, 75% active, ${(1200).toLocaleString()} keys, 30 clicks, 2 sessions`,
    );
  });
});
