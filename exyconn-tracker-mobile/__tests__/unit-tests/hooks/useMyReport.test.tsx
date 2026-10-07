import { act, renderHook, waitFor } from '@testing-library/react';
import { monthBounds, type ReportDay } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import { useMyReport } from '../../../src/hooks/useMyReport';
import { tracker } from '../../../src/tracker/instance';
import { deferred } from './deferred';

vi.mock('../../../src/tracker/instance', () => ({ tracker: { getReport: vi.fn() } }));

const LOAD_FAILED = 'Could not load your report. Check your connection and try again.';
const SEPTEMBER = new Date(2026, 8, 1);
const OCTOBER = new Date(2026, 9, 1);

function reportDay(date: string, activeMs: number, idleMs: number): ReportDay {
  return { date, activeMs, idleMs, keyCount: 0, mouseCount: 0, sessions: 1 };
}

const DAYS = [reportDay('2026-09-01', 3_000, 1_000), reportDay('2026-09-02', 5_000, 1_000)];

describe('useMyReport', () => {
  it("reads the month bounded in the employee's zone, and adds it up", async () => {
    vi.mocked(tracker.getReport).mockResolvedValue(DAYS);
    const { fromISO, toISO } = monthBounds(SEPTEMBER, 'UTC');
    const { result } = renderHook(() => useMyReport(SEPTEMBER, 'UTC'));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(tracker.getReport).toHaveBeenCalledWith(fromISO, toISO);
    expect(result.current.days).toEqual(DAYS);
    expect(result.current.totals).toEqual({ activeMs: 8_000, idleMs: 2_000, activityPercent: 80 });
  });

  it('keeps the month on screen while a pull-to-refresh re-reads it', async () => {
    const again = deferred<ReportDay[]>();
    vi.mocked(tracker.getReport).mockResolvedValueOnce(DAYS).mockReturnValueOnce(again.promise);
    const { result } = renderHook(() => useMyReport(SEPTEMBER, 'UTC'));
    await waitFor(() => expect(result.current.days).toEqual(DAYS));
    act(() => result.current.reload());
    expect(result.current.refreshing).toBe(true);
    expect(result.current.loading).toBe(false);
    await act(async () => {
      again.resolve([]);
      await again.promise;
    });
    expect(result.current.refreshing).toBe(false);
    expect(result.current.days).toEqual([]);
  });

  it('empties the month and says so when the report cannot be read', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(tracker.getReport).mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useMyReport(SEPTEMBER, 'UTC'));
    await waitFor(() => expect(result.current.error).toBe(LOAD_FAILED));
    expect(result.current.days).toEqual([]);
    expect(result.current.totals.activeMs).toBe(0);
    expect(result.current.loading).toBe(false);
    expect(error).toHaveBeenCalledWith('Failed to load report', expect.any(Error));
  });

  it('ignores the answer for a month that is no longer on screen', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const september = deferred<ReportDay[]>();
    const failing = deferred<ReportDay[]>();
    const october = [reportDay('2026-10-01', 1_000, 0)];
    vi.mocked(tracker.getReport)
      .mockReturnValueOnce(september.promise)
      .mockReturnValueOnce(failing.promise)
      .mockResolvedValueOnce(october);
    const { result, rerender } = renderHook(({ month, zone }) => useMyReport(month, zone), {
      initialProps: { month: SEPTEMBER, zone: 'UTC' },
    });
    rerender({ month: SEPTEMBER, zone: 'Asia/Kolkata' });
    rerender({ month: OCTOBER, zone: 'UTC' });
    await waitFor(() => expect(result.current.days).toEqual(october));
    await act(async () => {
      september.resolve(DAYS);
      failing.reject(new Error('late'));
      await Promise.allSettled([september.promise, failing.promise]);
    });
    expect(result.current.days).toEqual(october);
    expect(result.current.error).toBeNull();
  });
});
