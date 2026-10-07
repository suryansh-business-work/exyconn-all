import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useCaptureSync } from '../../../src/hooks/useCaptureSync';
import { tracker } from '../../../src/tracker/instance';
import { deferred } from './deferred';

vi.mock('../../../src/tracker/instance', () => ({ tracker: { syncNow: vi.fn() } }));

describe('useCaptureSync', () => {
  it('opens a gallery reached from a day at once, without syncing', () => {
    const { result } = renderHook(() => useCaptureSync(''));
    expect(result.current).toBe(false);
    expect(tracker.syncNow).not.toHaveBeenCalled();
  });

  it('uploads the outbox first when opened from a capture notification', async () => {
    const sync = deferred<undefined>();
    vi.mocked(tracker.syncNow).mockReturnValue(sync.promise);
    const { result } = renderHook(() => useCaptureSync('2026-09-11T10:00:00.000Z'));
    expect(result.current).toBe(true);
    expect(tracker.syncNow).toHaveBeenCalledTimes(1);
    sync.resolve(undefined);
    await waitFor(() => expect(result.current).toBe(false));
  });

  it('logs a failed sync and opens the gallery anyway', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const cause = new Error('offline');
    vi.mocked(tracker.syncNow).mockRejectedValue(cause);
    const { result } = renderHook(() => useCaptureSync('2026-09-11T10:00:00.000Z'));
    await waitFor(() => expect(result.current).toBe(false));
    expect(error).toHaveBeenCalledWith('Sync after a capture notification failed', cause);
  });

  it('stops waiting when the capture is cleared', async () => {
    vi.mocked(tracker.syncNow).mockReturnValue(deferred<undefined>().promise);
    const { result, rerender } = renderHook(({ at }) => useCaptureSync(at), {
      initialProps: { at: '2026-09-11T10:00:00.000Z' },
    });
    expect(result.current).toBe(true);
    rerender({ at: '' });
    await waitFor(() => expect(result.current).toBe(false));
  });

  it('does not touch a gallery that was left while the sync ran', async () => {
    const sync = deferred<undefined>();
    vi.mocked(tracker.syncNow).mockReturnValue(sync.promise);
    const { result, unmount } = renderHook(() => useCaptureSync('2026-09-11T10:00:00.000Z'));
    unmount();
    sync.resolve(undefined);
    await sync.promise;
    expect(result.current).toBe(true);
  });
});
