import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { TrackerExpectedFieldsFragment } from '@/graphql/generated';
import { useMonthTarget } from '@/pages/tracker-view/useMonthTarget';
import type { TrackerDayBucketData } from '@/pages/tracker-view/tracker.types';

const HOUR = 3_600_000;
const day = (
  date: string,
  expectedMs: number,
  offReason: string | null = null,
  offLabel: string | null = null,
) => ({
  __typename: 'TrackerExpectedDay' as const,
  date,
  expectedMs,
  offReason,
  offLabel,
});

/** 1–7 June 2026, Monday to Sunday: a holiday Tuesday, casual leave Wednesday, weekend off. */
const CONTRACT = {
  __typename: 'TrackerExpected',
  workHoursPerDay: 8,
  days: [
    day('2026-06-01', 8 * HOUR),
    day('2026-06-02', 0, 'HOLIDAY', 'Founders Day'),
    day('2026-06-03', 0, 'LEAVE', 'CL'),
    day('2026-06-04', 8 * HOUR),
    day('2026-06-05', 8 * HOUR),
    day('2026-06-06', 0, 'WEEKEND'),
    day('2026-06-07', 0, 'WEEKEND'),
  ],
} as TrackerExpectedFieldsFragment;

const bucket = (date: string, activeMs: number, manualMs = 0) =>
  ({
    date,
    activeMs,
    manualMs,
    idleMs: 0,
    keyCount: 0,
    mouseCount: 0,
    sessions: 1,
  }) as TrackerDayBucketData;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  // Friday 5 June, mid-morning in India: the 5th is still being worked.
  vi.setSystemTime(new Date('2026-06-05T05:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useMonthTarget', () => {
  it('has nothing to compare before the contract loads', () => {
    const { result } = renderHook(() => useMonthTarget(undefined, [], 'Asia/Kolkata'));
    expect(result.current).toEqual({
      target: null,
      dayMarks: undefined,
      dayLabels: undefined,
      workDays: null,
      workHoursPerDay: null,
    });
  });

  it('marks short finished days, leave, holidays and the week off, with their names', () => {
    const buckets = [bucket('2026-06-01', 8 * HOUR), bucket('2026-06-04', 5 * HOUR, 1 * HOUR)];
    const { result } = renderHook(() => useMonthTarget(CONTRACT, buckets, 'Asia/Kolkata'));
    const { target, dayMarks, dayLabels, workDays, workHoursPerDay } = result.current;

    expect(target?.expectedMs).toBe(24 * HOUR);
    // Only the 1st and the 4th are over; today (the 5th) does not count yet.
    expect(target?.expectedSoFarMs).toBe(16 * HOUR);
    expect(target?.workedMs).toBe(14 * HOUR);
    expect(target?.deficitMs).toBe(-2 * HOUR);
    expect(Object.fromEntries(dayMarks ?? [])).toEqual({
      '2026-06-02': 'HOLIDAY',
      '2026-06-03': 'LEAVE',
      '2026-06-04': 'SHORT',
      '2026-06-06': 'WEEK_OFF',
      '2026-06-07': 'WEEK_OFF',
    });
    expect(Object.fromEntries(dayLabels ?? [])).toEqual({
      '2026-06-02': 'Founders Day',
      '2026-06-03': 'CL',
    });
    // Saturday and Sunday are the week off; a holiday or leave on a weekday does not hide it.
    expect(workDays).toEqual([1, 2, 3, 4, 5]);
    expect(workHoursPerDay).toBe(8);
  });

  it("reads today in the employee's zone, not the browser's", () => {
    // 5 June 20:00 UTC is already the 6th in Auckland, so the 5th is over there and short.
    vi.setSystemTime(new Date('2026-06-05T20:00:00.000Z'));
    const buckets = [bucket('2026-06-01', 8 * HOUR), bucket('2026-06-04', 8 * HOUR)];
    const auckland = renderHook(() => useMonthTarget(CONTRACT, buckets, 'Pacific/Auckland'));
    expect(auckland.result.current.dayMarks?.get('2026-06-05')).toBe('SHORT');
    const utc = renderHook(() => useMonthTarget(CONTRACT, buckets, 'UTC'));
    expect(utc.result.current.dayMarks?.has('2026-06-05')).toBe(false);
  });

  it('keeps the same answer while its inputs are unchanged', () => {
    const buckets = [bucket('2026-06-01', 8 * HOUR)];
    const { result, rerender } = renderHook(() => useMonthTarget(CONTRACT, buckets, 'UTC'));
    const first = result.current.target;
    rerender();
    expect(result.current.target).toBe(first);
  });
});
