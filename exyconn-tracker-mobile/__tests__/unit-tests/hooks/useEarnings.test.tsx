import { act, renderHook, waitFor } from '@testing-library/react';
import { dayBounds, monthBounds, type TrackerEarnings } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import { useEarnings } from '../../../src/hooks/useEarnings';
import { tracker } from '../../../src/tracker/instance';
import { deferred } from './deferred';

vi.mock('../../../src/tracker/instance', () => ({ tracker: { getEarnings: vi.fn() } }));

function earnings(trackedMs: number): TrackerEarnings {
  return { payType: 'HOURLY', rate: 10, currency: 'USD', trackedMs, amount: trackedMs / 360_000 };
}

describe('useEarnings', () => {
  it('reads today and this month, bounded in the employee’s zone', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-30T20:00:00.000Z'));
    vi.mocked(tracker.getEarnings)
      .mockResolvedValueOnce(earnings(3_600_000))
      .mockResolvedValueOnce(earnings(36_000_000));
    const { result } = renderHook(() => useEarnings('Asia/Kolkata', null));
    expect(result.current).toEqual({ today: null, month: null, failed: false });

    await waitFor(() => expect(result.current.month).not.toBeNull());
    // Already 1 October in Kolkata: today and the month are October's.
    const october = new Date(2026, 9, 1);
    const day = dayBounds(october, 'Asia/Kolkata');
    const month = monthBounds(october, 'Asia/Kolkata');
    expect(tracker.getEarnings).toHaveBeenNthCalledWith(1, day.startISO, day.endISO);
    expect(tracker.getEarnings).toHaveBeenNthCalledWith(2, month.fromISO, month.toISO);
    expect(result.current).toEqual({
      today: earnings(3_600_000),
      month: earnings(36_000_000),
      failed: false,
    });
  });

  it('keeps the last good figures and says the re-read failed', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(tracker.getEarnings)
      .mockResolvedValueOnce(earnings(1))
      .mockResolvedValueOnce(earnings(2))
      .mockRejectedValue(new Error('offline'));
    const { result, rerender } = renderHook(({ at }) => useEarnings('UTC', at), {
      initialProps: { at: null as string | null },
    });
    await waitFor(() => expect(result.current.month).toEqual(earnings(2)));

    rerender({ at: '2026-09-30T10:00:00.000Z' });
    await waitFor(() => expect(result.current.failed).toBe(true));
    expect(result.current.today).toEqual(earnings(1));
    expect(result.current.month).toEqual(earnings(2));
    expect(error).toHaveBeenCalledWith('Failed to load earnings', expect.any(Error));
  });

  it('ignores the answers of a read it has moved on from', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const late = deferred<TrackerEarnings>();
    const lateFailure = deferred<TrackerEarnings>();
    vi.mocked(tracker.getEarnings)
      .mockReturnValueOnce(late.promise)
      .mockReturnValueOnce(late.promise)
      .mockReturnValueOnce(lateFailure.promise)
      .mockReturnValueOnce(lateFailure.promise)
      .mockResolvedValue(earnings(5));
    const { result, rerender } = renderHook(({ zone }) => useEarnings(zone, null), {
      initialProps: { zone: 'UTC' },
    });
    rerender({ zone: 'Asia/Dubai' });
    rerender({ zone: 'Europe/London' });
    await waitFor(() => expect(result.current.month).toEqual(earnings(5)));

    await act(async () => {
      late.resolve(earnings(9));
      lateFailure.reject(new Error('late'));
      await Promise.allSettled([late.promise, lateFailure.promise]);
    });
    expect(result.current).toEqual({ today: earnings(5), month: earnings(5), failed: false });
  });
});
