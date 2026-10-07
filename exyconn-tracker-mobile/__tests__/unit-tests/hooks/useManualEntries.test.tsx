import { act, renderHook, waitFor } from '@testing-library/react';
import type { ManualEntry } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import { useManualEntries } from '../../../src/hooks/useManualEntries';
import { tracker } from '../../../src/tracker/instance';
import { deferred } from './deferred';

vi.mock('../../../src/tracker/instance', () => ({ tracker: { getManualEntries: vi.fn() } }));

const DAY_MS = 24 * 60 * 60 * 1000;
const LOAD_FAILED = 'Could not load your claims. Check your connection and try again.';

const CLAIM: ManualEntry = {
  id: 'm1',
  projectName: 'Website',
  taskKey: 'EXY-14',
  taskTitle: 'Client call',
  startedAt: '2026-09-10T09:00:00.000Z',
  endedAt: '2026-09-10T10:00:00.000Z',
  durationMs: 60 * 60 * 1000,
  note: 'Kick-off',
  status: 'PENDING',
  reviewNote: '',
};

describe('useManualEntries', () => {
  it('reads the last 90 days of claims when the screen comes to the front', async () => {
    vi.mocked(tracker.getManualEntries).mockResolvedValue([CLAIM]);
    const { result } = renderHook(() => useManualEntries());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.entries).toEqual([CLAIM]);
    expect(result.current.error).toBeNull();
    const [from, to] = vi.mocked(tracker.getManualEntries).mock.calls[0];
    expect(Date.parse(to) - Date.parse(from)).toBe(90 * DAY_MS);
  });

  it('shows a plain sentence and an empty list when the portal cannot be reached', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const cause = new Error('offline');
    vi.mocked(tracker.getManualEntries).mockRejectedValue(cause);
    const { result } = renderHook(() => useManualEntries());
    await waitFor(() => expect(result.current.error).toBe(LOAD_FAILED));
    expect(result.current.entries).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(error).toHaveBeenCalledWith('Failed to load off-computer time', cause);
  });

  it('tries again on reload, clearing the earlier failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(tracker.getManualEntries)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([CLAIM]);
    const { result } = renderHook(() => useManualEntries());
    await waitFor(() => expect(result.current.error).toBe(LOAD_FAILED));
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.entries).toEqual([CLAIM]));
    expect(result.current.error).toBeNull();
    expect(tracker.getManualEntries).toHaveBeenCalledTimes(2);
  });

  it('leaves a screen that was left mid-request as it was', async () => {
    const rows = deferred<ManualEntry[]>();
    vi.mocked(tracker.getManualEntries).mockReturnValue(rows.promise);
    const { result, unmount } = renderHook(() => useManualEntries());
    unmount();
    await act(async () => {
      rows.resolve([CLAIM]);
      await rows.promise;
    });
    expect(result.current.entries).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it('drops a failure that lands after the screen was left', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const rows = deferred<ManualEntry[]>();
    vi.mocked(tracker.getManualEntries).mockReturnValue(rows.promise);
    const { result, unmount } = renderHook(() => useManualEntries());
    unmount();
    await act(async () => {
      rows.reject(new Error('offline'));
      await rows.promise.catch(() => undefined);
    });
    await waitFor(() => expect(error).toHaveBeenCalled());
    expect(result.current.error).toBeNull();
  });
});
