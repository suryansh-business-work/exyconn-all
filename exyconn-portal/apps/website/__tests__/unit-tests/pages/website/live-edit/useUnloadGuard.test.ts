import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUnloadGuard } from '../../../../../src/pages/website/live-edit/useUnloadGuard';

/** Fires a cancelable beforeunload, as the browser does on close or reload. */
function unload(): Event {
  const event = new Event('beforeunload', { cancelable: true });
  globalThis.dispatchEvent(event);
  return event;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useUnloadGuard', () => {
  it('lets the tab close when there is nothing unsaved', () => {
    const add = vi.spyOn(globalThis, 'addEventListener');
    renderHook(() => useUnloadGuard(false));
    expect(add).not.toHaveBeenCalledWith('beforeunload', expect.any(Function));
    expect(unload().defaultPrevented).toBe(false);
  });

  it('asks the browser to warn while there is unsaved work', () => {
    const { unmount } = renderHook(() => useUnloadGuard(true));
    expect(unload().defaultPrevented).toBe(true);
    unmount();
  });

  it('stops warning once the work is saved', () => {
    const remove = vi.spyOn(globalThis, 'removeEventListener');
    const { rerender } = renderHook(({ active }) => useUnloadGuard(active), {
      initialProps: { active: true },
    });
    rerender({ active: false });
    expect(remove).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    expect(unload().defaultPrevented).toBe(false);
  });

  it('stops warning when the screen goes away', () => {
    const { unmount } = renderHook(() => useUnloadGuard(true));
    unmount();
    expect(unload().defaultPrevented).toBe(false);
  });
});
