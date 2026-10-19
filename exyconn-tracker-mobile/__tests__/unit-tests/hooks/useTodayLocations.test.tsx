import { act, renderHook, waitFor } from '@testing-library/react';
import { LOCATION_POLL_MS, type TrackerLocationPin } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import { useTodayLocations } from '../../../src/hooks/useTodayLocations';
import { tracker } from '../../../src/tracker/instance';
import { deferred } from './deferred';

vi.mock('../../../src/tracker/instance', () => ({ tracker: { getLocations: vi.fn() } }));

/** Arbitrary test coordinates. */
const PIN: TrackerLocationPin = {
  id: 'l1',
  kind: 'ATTENDANCE',
  lat: 12.97,
  lng: 77.59,
  accuracyM: 10,
  source: 'GPS',
  capturedAt: '2026-09-30T04:00:00.000Z',
};

describe('useTodayLocations', () => {
  it('reads today’s pins in the employee’s zone', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-30T20:00:00.000Z'));
    vi.mocked(tracker.getLocations).mockResolvedValue([PIN]);
    const { result } = renderHook(() => useTodayLocations('Asia/Kolkata', true, false));
    expect(result.current).toEqual({ pins: [], loading: true, failed: false });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(tracker.getLocations).toHaveBeenCalledWith('2026-10-01');
    expect(result.current).toEqual({ pins: [PIN], loading: false, failed: false });
  });

  it('says the read failed, keeping what it had', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(tracker.getLocations)
      .mockResolvedValueOnce([PIN])
      .mockRejectedValueOnce(new Error('offline'));
    const { result, rerender } = renderHook(
      ({ marked }) => useTodayLocations('UTC', marked, false),
      {
        initialProps: { marked: false },
      },
    );
    await waitFor(() => expect(result.current.pins).toEqual([PIN]));

    // Marking attendance sends the first pin, so the list is read again.
    rerender({ marked: true });
    await waitFor(() => expect(result.current.failed).toBe(true));
    expect(result.current.pins).toEqual([PIN]);
    expect(error).toHaveBeenCalledWith('Failed to load today’s locations', expect.any(Error));
  });

  it('re-reads on the move check’s beat while tracking, and stops when tracking does', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    vi.mocked(tracker.getLocations).mockResolvedValue([]);
    const { rerender } = renderHook(({ tracking }) => useTodayLocations('UTC', true, tracking), {
      initialProps: { tracking: true },
    });
    await waitFor(() => expect(tracker.getLocations).toHaveBeenCalledTimes(1));

    act(() => {
      vi.advanceTimersByTime(LOCATION_POLL_MS);
    });
    await waitFor(() => expect(tracker.getLocations).toHaveBeenCalledTimes(2));

    rerender({ tracking: false });
    act(() => {
      vi.advanceTimersByTime(LOCATION_POLL_MS * 3);
    });
    expect(tracker.getLocations).toHaveBeenCalledTimes(2);
  });

  it('ignores the answers of a read it has moved on from', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const late = deferred<TrackerLocationPin[]>();
    const lateFailure = deferred<TrackerLocationPin[]>();
    vi.mocked(tracker.getLocations)
      .mockReturnValueOnce(late.promise)
      .mockReturnValueOnce(lateFailure.promise)
      .mockResolvedValue([]);
    const { result, rerender } = renderHook(({ zone }) => useTodayLocations(zone, true, false), {
      initialProps: { zone: 'UTC' },
    });
    rerender({ zone: 'Asia/Dubai' });
    rerender({ zone: 'Europe/London' });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      late.resolve([PIN]);
      lateFailure.reject(new Error('late'));
      await Promise.allSettled([late.promise, lateFailure.promise]);
    });
    expect(result.current).toEqual({ pins: [], loading: false, failed: false });
  });
});
