import { act, renderHook, waitFor } from '@testing-library/react';
import { periodWindow, type ReportDay } from '@exyconn/tracker-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePeriodInsights } from '../../../src/hooks/usePeriodInsights';
import { tracker } from '../../../src/tracker/instance';
import { deferred } from './deferred';

vi.mock('../../../src/tracker/instance', () => ({ tracker: { getReport: vi.fn() } }));

const LOAD_FAILED = 'Could not load your insights. Check your connection and try again.';
const HOUR = 3_600_000;

function reportDay(date: string, activeMs: number): ReportDay {
  return { date, activeMs, idleMs: 0, keyCount: 10, mouseCount: 5, sessions: 1 };
}

describe('usePeriodInsights', () => {
  beforeEach(() => {
    // Only the clock is pinned: the promises and waitFor keep real timers.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-15T12:00:00.000Z'));
  });

  it('reads both periods in one query and sets the last week against the one before', async () => {
    vi.mocked(tracker.getReport).mockResolvedValue([
      reportDay('2026-09-15', 2 * HOUR),
      reportDay('2026-09-10', HOUR),
      reportDay('2026-09-05', HOUR),
    ]);
    const expected = periodWindow(new Date(2026, 8, 15), 7, 'UTC');
    const { result } = renderHook(() => usePeriodInsights(7, 'UTC'));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(tracker.getReport).toHaveBeenCalledWith(expected.fromISO, expected.toISO);
    expect(result.current.range.current.at(-1)).toBe('2026-09-15');
    expect(result.current.current.activeMs).toBe(3 * HOUR);
    expect(result.current.current.trackedDays).toBe(2);
    expect(result.current.previous.activeMs).toBe(HOUR);
    expect(result.current.columns).toHaveLength(7);
    expect(result.current.columns.at(-1)?.value).toBe(1);
  });

  it('hands back the same object while nothing has changed', async () => {
    vi.mocked(tracker.getReport).mockResolvedValue([]);
    const { result, rerender } = renderHook(() => usePeriodInsights(7, 'UTC'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it('keeps the figures on screen while a pull-to-refresh re-reads them', async () => {
    const again = deferred<ReportDay[]>();
    vi.mocked(tracker.getReport)
      .mockResolvedValueOnce([reportDay('2026-09-15', HOUR)])
      .mockReturnValueOnce(again.promise);
    const { result } = renderHook(() => usePeriodInsights(7, 'UTC'));
    await waitFor(() => expect(result.current.current.activeMs).toBe(HOUR));
    act(() => result.current.reload());
    expect(result.current.refreshing).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.current.activeMs).toBe(HOUR);
    await act(async () => {
      again.resolve([]);
      await again.promise;
    });
    expect(result.current.refreshing).toBe(false);
    expect(result.current.current.activeMs).toBe(0);
  });

  it('empties the figures and says so when the report cannot be read', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(tracker.getReport).mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => usePeriodInsights(30, 'UTC'));
    await waitFor(() => expect(result.current.error).toBe(LOAD_FAILED));
    expect(result.current.current.activeMs).toBe(0);
    expect(result.current.loading).toBe(false);
    expect(error).toHaveBeenCalledWith('Failed to load the period insights', expect.any(Error));
  });

  it('ignores the answer for a period that is no longer on screen', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const week = deferred<ReportDay[]>();
    const failing = deferred<ReportDay[]>();
    vi.mocked(tracker.getReport)
      .mockReturnValueOnce(week.promise)
      .mockReturnValueOnce(failing.promise)
      .mockResolvedValueOnce([]);
    const { result, rerender } = renderHook(({ length }) => usePeriodInsights(length, 'UTC'), {
      initialProps: { length: 7 as 7 | 30 },
    });
    rerender({ length: 30 });
    rerender({ length: 7 });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      week.resolve([reportDay('2026-09-15', HOUR)]);
      failing.reject(new Error('late'));
      await Promise.allSettled([week.promise, failing.promise]);
    });
    expect(result.current.current.activeMs).toBe(0);
    expect(result.current.error).toBeNull();
    expect(result.current.range.current).toHaveLength(7);
  });
});
