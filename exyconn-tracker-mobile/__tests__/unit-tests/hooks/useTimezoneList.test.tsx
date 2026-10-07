import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useTimezoneList } from '../../../src/hooks/useTimezoneList';
import { tracker } from '../../../src/tracker/instance';
import { deferred } from './deferred';

vi.mock('../../../src/tracker/instance', () => ({ tracker: { getTimezones: vi.fn() } }));

const ZONES = ['Asia/Kolkata', 'Europe/London', 'UTC'];

describe('useTimezoneList', () => {
  it('has no list until the portal answers, then offers its zones', async () => {
    vi.mocked(tracker.getTimezones).mockResolvedValue(ZONES);
    const { result } = renderHook(() => useTimezoneList());
    expect(result.current.zones).toBeNull();
    await waitFor(() => expect(result.current.zones).toEqual(ZONES));
    expect(result.current.failed).toBe(false);
  });

  it('says it failed, and recovers on reload', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(tracker.getTimezones)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(ZONES);
    const { result } = renderHook(() => useTimezoneList());
    await waitFor(() => expect(result.current.failed).toBe(true));
    expect(result.current.zones).toBeNull();
    expect(error).toHaveBeenCalledWith('Failed to load the timezone list', expect.any(Error));
    act(() => result.current.reload());
    expect(result.current.failed).toBe(false);
    await waitFor(() => expect(result.current.zones).toEqual(ZONES));
  });

  it('ignores answers that land after the screen was left', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const ok = deferred<string[]>();
    const failing = deferred<string[]>();
    vi.mocked(tracker.getTimezones).mockReturnValueOnce(ok.promise);
    const first = renderHook(() => useTimezoneList());
    first.unmount();
    vi.mocked(tracker.getTimezones).mockReturnValueOnce(failing.promise);
    const second = renderHook(() => useTimezoneList());
    second.unmount();
    await act(async () => {
      ok.resolve(ZONES);
      failing.reject(new Error('late'));
      await Promise.allSettled([ok.promise, failing.promise]);
    });
    expect(first.result.current.zones).toBeNull();
    expect(second.result.current.failed).toBe(false);
  });
});
