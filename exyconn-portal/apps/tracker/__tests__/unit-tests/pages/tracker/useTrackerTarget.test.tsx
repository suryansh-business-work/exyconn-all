import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { TrackerDayBucketData } from '@exyconn/shell/pages/tracker-view/tracker.types';
import { useTrackerTarget } from '../../../../src/pages/tracker/useTrackerTarget';
import { queryResult } from './tracker.fixtures';

const gql = vi.hoisted(() => ({ expected: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useTrackerExpectedQuery: gql.expected,
}));

const HOUR = 3_600_000;
const RANGE = { from: '2026-01-01T00:00:00.000Z', to: '2026-01-31T23:59:59.999Z' };

type Day = { date: string; expectedMs: number; offReason: string | null; offLabel: string | null };
const work = (date: string): Day => ({
  date,
  expectedMs: 8 * HOUR,
  offReason: null,
  offLabel: null,
});
const off = (date: string, offReason: string, offLabel: string | null = null): Day => ({
  date,
  expectedMs: 0,
  offReason,
  offLabel,
});

/** The first week of January 2026 (it opens on a Thursday) on a Monday-to-Friday contract. */
const CONTRACT = {
  workHoursPerDay: 8,
  days: [
    off('2026-01-01', 'HOLIDAY', 'New Year'),
    work('2026-01-02'),
    off('2026-01-03', 'WEEKEND'),
    off('2026-01-04', 'WEEKEND'),
    off('2026-01-05', 'LEAVE', 'CL'),
    work('2026-01-06'),
  ],
};

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
const BUCKETS = [bucket('2026-01-02', 4 * HOUR), bucket('2026-01-06', HOUR)];

function renderTarget(employeeId: string | null, buckets: TrackerDayBucketData[] = BUCKETS) {
  return renderHook(() => useTrackerTarget({ employeeId, range: RANGE, timezone: 'UTC', buckets }))
    .result.current;
}

describe('useTrackerTarget', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-01-06T10:00:00Z'));
    gql.expected.mockReset().mockReturnValue(queryResult({ trackerExpected: CONTRACT }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('asks for the selected employee month in their timezone', () => {
    renderTarget('u1');
    expect(gql.expected).toHaveBeenCalledWith({
      variables: { userId: 'u1', ...RANGE, timezone: 'UTC' },
      skip: false,
    });
  });

  it('measures the month against the contract, only counting days already over', () => {
    const { target, workHoursPerDay } = renderTarget('u1');
    expect(workHoursPerDay).toBe(8);
    expect(target?.expectedMs).toBe(16 * HOUR);
    expect(target?.workedMs).toBe(5 * HOUR);
    // Only 2 January is over and worth anything: 5h logged against 8h expected.
    expect(target?.deficitMs).toBe(-3 * HOUR);
    expect(target?.leaveMs).toBe(8 * HOUR);
  });

  it('counts approved off-computer time towards the day', () => {
    const { target } = renderTarget('u1', [bucket('2026-01-02', 4 * HOUR, 4 * HOUR)]);
    expect(target?.deficitMs).toBe(0);
    expect(target?.shortDates.size).toBe(0);
  });

  it('marks each day once — short, week off, holiday or leave — and names the named ones', () => {
    const { dayMarks, dayLabels } = renderTarget('u1');
    expect(Object.fromEntries(dayMarks ?? [])).toEqual({
      '2026-01-01': 'HOLIDAY',
      '2026-01-02': 'SHORT',
      '2026-01-03': 'WEEK_OFF',
      '2026-01-04': 'WEEK_OFF',
      '2026-01-05': 'LEAVE',
    });
    expect(Object.fromEntries(dayLabels ?? [])).toEqual({
      '2026-01-01': 'New Year',
      '2026-01-05': 'CL',
    });
  });

  it('does not call today short while it is still being worked', () => {
    const { dayMarks } = renderTarget('u1');
    expect(dayMarks?.has('2026-01-06')).toBe(false);
  });

  it('reads the working week off the contract week offs', () => {
    expect(renderTarget('u1').workDays).toEqual([1, 2, 3, 4, 5]);
  });

  it('reads a Sunday-to-Thursday week the same way', () => {
    gql.expected.mockReturnValue(
      queryResult({
        trackerExpected: {
          workHoursPerDay: 9,
          days: [off('2026-01-02', 'WEEKEND'), off('2026-01-03', 'WEEKEND'), work('2026-01-04')],
        },
      }),
    );
    const { workDays, workHoursPerDay } = renderTarget('u1');
    expect(workDays).toEqual([0, 1, 2, 3, 4]);
    expect(workHoursPerDay).toBe(9);
  });

  it('keeps a weekday that only has a holiday on it a working day', () => {
    gql.expected.mockReturnValue(
      queryResult({
        trackerExpected: { workHoursPerDay: 8, days: [off('2026-01-01', 'HOLIDAY')] },
      }),
    );
    expect(renderTarget('u1').workDays).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('asks nothing and shows nothing until an employee is picked', () => {
    gql.expected.mockReturnValue(queryResult(undefined));
    const result = renderTarget(null);
    expect(gql.expected).toHaveBeenCalledWith({
      variables: { userId: '', ...RANGE, timezone: 'UTC' },
      skip: true,
    });
    expect(result).toMatchObject({
      target: null,
      dayMarks: undefined,
      dayLabels: undefined,
      workDays: null,
      workHoursPerDay: null,
      loading: false,
    });
  });

  it('passes the loading flag and the error through', () => {
    const failure = new Error('Expected hours unavailable');
    gql.expected.mockReturnValue(queryResult(undefined, true, { error: failure }));
    const { loading, error, target } = renderTarget('u1');
    expect(loading).toBe(true);
    expect(error).toBe(failure);
    expect(target).toBeNull();
  });
});
