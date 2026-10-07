// @vitest-environment jsdom
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReportDay } from '@shared/types';
import type { PeriodLength } from '@exyconn/tracker-core';
import usePeriodInsights, {
  type PeriodInsights,
} from '../../../../src/renderer/hooks/usePeriodInsights';
import { deferred, flush, render, rerender, stubTracker, unmountAll } from '../../test-utils';

function day(date: string, activeMs: number, idleMs: number): ReportDay {
  return { date, activeMs, idleMs, keyCount: 100, mouseCount: 50, sessions: 2 };
}

const ROWS = [
  day('2026-09-14', 3_000_000, 1_000_000),
  day('2026-09-10', 1_000_000, 0),
  day('2026-09-03', 1_800_000, 200_000),
];

let latest: PeriodInsights | null = null;

function Probe({ length, zone }: Readonly<{ length: PeriodLength; zone: string }>): ReactElement {
  latest = usePeriodInsights(length, zone);
  return <span />;
}

function current(): PeriodInsights {
  if (latest === null) {
    throw new Error('Probe not rendered');
  }
  return latest;
}

beforeEach(() => {
  // Only the clock: real timers keep the harness's settling working.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-09-14T10:00:00.000Z'));
});

afterEach(() => {
  unmountAll();
  vi.useRealTimers();
  vi.restoreAllMocks();
  latest = null;
});

describe('usePeriodInsights', () => {
  it('compares the last seven days with the seven before, in one query', async () => {
    const answer = deferred<ReportDay[]>();
    const getReport = vi.fn(() => answer.promise);
    stubTracker({ getReport });
    await render(<Probe length={7} zone="UTC" />);
    expect(getReport).toHaveBeenCalledTimes(1);
    expect(getReport).toHaveBeenCalledWith('2026-09-01T00:00:00.000Z', '2026-09-15T00:00:00.000Z');
    expect(current().loading).toBe(true);
    expect(current().range.current[0]).toBe('2026-09-08');
    expect(current().range.current.at(-1)).toBe('2026-09-14');
    expect(current().range.previous[0]).toBe('2026-09-01');

    answer.resolve(ROWS);
    await flush();
    const insights = current();
    expect(insights.loading).toBe(false);
    expect(insights.error).toBeNull();
    expect(insights.current).toMatchObject({
      activeMs: 4_000_000,
      idleMs: 1_000_000,
      sessions: 4,
      trackedDays: 2,
      activityPercent: 80,
    });
    expect(insights.previous).toMatchObject({ activeMs: 1_800_000, trackedDays: 1 });
    expect(insights.columns).toHaveLength(7);
    expect(insights.columns.at(-1)?.date).toBe('2026-09-14');
  });

  it('keeps the same result object across re-renders that change nothing', async () => {
    stubTracker({ getReport: () => Promise.resolve(ROWS) });
    await render(<Probe length={7} zone="UTC" />);
    await flush();
    const first = current();
    await rerender(<Probe length={7} zone="UTC" />);
    expect(current()).toBe(first);
  });

  it('empties the comparison and explains when the report cannot be read', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const getReport = vi.fn().mockResolvedValueOnce(ROWS).mockRejectedValueOnce(new Error('x'));
    stubTracker({ getReport });
    await render(<Probe length={7} zone="UTC" />);
    await flush();
    await rerender(<Probe length={30} zone="UTC" />);
    await flush();
    expect(getReport).toHaveBeenLastCalledWith(
      '2026-07-17T00:00:00.000Z',
      '2026-09-15T00:00:00.000Z',
    );
    const insights = current();
    expect(insights.error).toBe(
      'Could not load your insights. Check your connection and try again.',
    );
    expect(insights.loading).toBe(false);
    expect(insights.current.activeMs).toBe(0);
    expect(insights.columns).toHaveLength(30);
    expect(log).toHaveBeenCalledWith('Failed to load the period insights', expect.any(Error));
  });

  it('ignores an answer for a period that is no longer shown', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const first = deferred<ReportDay[]>();
    const second = deferred<ReportDay[]>();
    const third = deferred<ReportDay[]>();
    const getReport = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
      .mockReturnValueOnce(third.promise);
    stubTracker({ getReport });
    await render(<Probe length={7} zone="UTC" />);
    await rerender(<Probe length={30} zone="UTC" />);
    await rerender(<Probe length={30} zone="Asia/Kolkata" />);
    first.resolve(ROWS);
    second.reject(new Error('late'));
    await flush();
    expect(current().loading).toBe(true);
    expect(current().error).toBeNull();
    third.resolve([]);
    await flush();
    expect(current().loading).toBe(false);
    expect(current().current.activeMs).toBe(0);
  });
});
