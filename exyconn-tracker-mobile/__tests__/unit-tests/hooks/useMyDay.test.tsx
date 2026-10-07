import { act, renderHook, waitFor } from '@testing-library/react';
import { dayBounds, type DayDetail } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import { useDayDetail, useMyDay } from '../../../src/hooks/useMyDay';
import { tracker } from '../../../src/tracker/instance';
import { deferred } from './deferred';

vi.mock('../../../src/tracker/instance', () => ({ tracker: { getDay: vi.fn() } }));

const LOAD_FAILED = 'Could not load this day. Check your connection and try again.';
const START = '2026-09-11T00:00:00.000Z';
const END = '2026-09-12T00:00:00.000Z';

function day(activeMs: number): DayDetail {
  return {
    activeMs,
    idleMs: 0,
    keyCount: 0,
    mouseCount: 0,
    sessions: 1,
    screenshots: [],
    intervals: [],
  };
}

describe('useDayDetail', () => {
  it('reads the day for the pair of instants it was given', async () => {
    vi.mocked(tracker.getDay).mockResolvedValue(day(3_600_000));
    const { result } = renderHook(() => useDayDetail(START, END));
    expect(result.current.loading).toBe(true);
    expect(result.current.detail).toBeNull();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.detail).toEqual(day(3_600_000));
    expect(result.current.refreshing).toBe(false);
    expect(tracker.getDay).toHaveBeenCalledWith(START, END);
  });

  it('keeps the day on screen under the refresh spinner when reloaded', async () => {
    const again = deferred<DayDetail>();
    vi.mocked(tracker.getDay).mockResolvedValueOnce(day(1000)).mockReturnValueOnce(again.promise);
    const { result } = renderHook(() => useDayDetail(START, END));
    await waitFor(() => expect(result.current.detail).toEqual(day(1000)));
    act(() => result.current.reload());
    expect(result.current.refreshing).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.detail).toEqual(day(1000));
    await act(async () => {
      again.resolve(day(2000));
      await again.promise;
    });
    expect(result.current.refreshing).toBe(false);
    expect(result.current.detail).toEqual(day(2000));
  });

  it('says so, with nothing stale left behind, when the day cannot be read', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const cause = new Error('offline');
    vi.mocked(tracker.getDay).mockRejectedValue(cause);
    const { result } = renderHook(() => useDayDetail(START, END));
    await waitFor(() => expect(result.current.error).toBe(LOAD_FAILED));
    expect(result.current.detail).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.refreshing).toBe(false);
    expect(error).toHaveBeenCalledWith('Failed to load day', cause);
  });

  it('re-reads when the refresh key moves — a new sync adds intervals', async () => {
    vi.mocked(tracker.getDay).mockResolvedValue(day(1000));
    const { result, rerender } = renderHook(({ key }) => useDayDetail(START, END, key), {
      initialProps: { key: 'sync-1' },
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    rerender({ key: 'sync-2' });
    await waitFor(() => expect(tracker.getDay).toHaveBeenCalledTimes(2));
  });

  it('ignores the answer for a day that is no longer on screen', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const first = deferred<DayDetail>();
    const failing = deferred<DayDetail>();
    vi.mocked(tracker.getDay)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(failing.promise)
      .mockResolvedValueOnce(day(3000));
    const { result, rerender } = renderHook(({ start }) => useDayDetail(start, END), {
      initialProps: { start: START },
    });
    rerender({ start: '2026-09-11T01:00:00.000Z' });
    rerender({ start: '2026-09-11T02:00:00.000Z' });
    await waitFor(() => expect(result.current.detail).toEqual(day(3000)));
    await act(async () => {
      first.resolve(day(1000));
      failing.reject(new Error('late'));
      await Promise.allSettled([first.promise, failing.promise]);
    });
    expect(result.current.detail).toEqual(day(3000));
    expect(result.current.error).toBeNull();
  });
});

describe('useMyDay', () => {
  it("bounds the tapped date in the employee's own zone", async () => {
    vi.mocked(tracker.getDay).mockResolvedValue(day(0));
    const date = new Date(2026, 8, 11);
    const expected = dayBounds(date, 'Asia/Kolkata');
    const { result } = renderHook(() => useMyDay(date, 'Asia/Kolkata'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(tracker.getDay).toHaveBeenCalledWith(expected.startISO, expected.endISO);
  });
});
