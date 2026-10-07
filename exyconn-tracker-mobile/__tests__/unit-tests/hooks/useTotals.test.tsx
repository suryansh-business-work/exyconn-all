import { act, renderHook, waitFor } from '@testing-library/react';
import type { TrackerTotals } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import { useTotals } from '../../../src/hooks/useTotals';
import { tracker } from '../../../src/tracker/instance';
import { deferred } from './deferred';

vi.mock('../../../src/tracker/instance', () => ({ tracker: { getTotals: vi.fn() } }));

function totals(activeMs: number): TrackerTotals {
  return { activeMs, idleMs: 0, screenshots: 4, sessions: 2 };
}

describe('useTotals', () => {
  it("loads the employee's all-time totals", async () => {
    vi.mocked(tracker.getTotals).mockResolvedValue(totals(1000));
    const { result } = renderHook(() => useTotals(null));
    expect(result.current).toEqual({ totals: null, loading: true, error: null });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.totals).toEqual(totals(1000));
  });

  it('says so when they cannot be read', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(tracker.getTotals).mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useTotals(null));
    await waitFor(() => expect(result.current.error).toBe('Could not load your all-time totals.'));
    expect(result.current.loading).toBe(false);
    expect(error).toHaveBeenCalledWith('Failed to load totals', expect.any(Error));
  });

  it('re-reads only after a sync, and only keeps the newest answer', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const stale = deferred<TrackerTotals>();
    const staleFailure = deferred<TrackerTotals>();
    vi.mocked(tracker.getTotals)
      .mockReturnValueOnce(stale.promise)
      .mockReturnValueOnce(staleFailure.promise)
      .mockResolvedValueOnce(totals(3000));
    const { result, rerender } = renderHook(({ at }) => useTotals(at), {
      initialProps: { at: 'sync-1' },
    });
    rerender({ at: 'sync-1' });
    expect(tracker.getTotals).toHaveBeenCalledTimes(1);
    rerender({ at: 'sync-2' });
    rerender({ at: 'sync-3' });
    await waitFor(() => expect(result.current.totals).toEqual(totals(3000)));
    await act(async () => {
      stale.resolve(totals(1000));
      staleFailure.reject(new Error('late'));
      await Promise.allSettled([stale.promise, staleFailure.promise]);
    });
    expect(result.current.totals).toEqual(totals(3000));
    expect(result.current.error).toBeNull();
  });
});
