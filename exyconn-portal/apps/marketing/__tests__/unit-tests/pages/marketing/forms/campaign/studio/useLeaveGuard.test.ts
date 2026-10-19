import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLeaveGuard } from '../../../../../../../src/pages/marketing/forms/campaign/studio/useLeaveGuard';

/** Fires the event the browser sends before a tab closes; true when something blocked it. */
const tryToLeave = () => {
  const event = new Event('beforeunload', { cancelable: true });
  globalThis.dispatchEvent(event);
  return event.defaultPrevented;
};

describe('useLeaveGuard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lets the tab close while everything is saved', () => {
    const add = vi.spyOn(globalThis, 'addEventListener');
    renderHook(() => useLeaveGuard(false));
    expect(add).not.toHaveBeenCalledWith('beforeunload', expect.any(Function));
    expect(tryToLeave()).toBe(false);
  });

  it('warns before the tab closes while changes are unsaved', () => {
    const { unmount } = renderHook(() => useLeaveGuard(true));
    expect(tryToLeave()).toBe(true);
    unmount();
  });

  it('stops warning once the changes are saved, and after unmount', () => {
    const { rerender, unmount } = renderHook(({ unsaved }) => useLeaveGuard(unsaved), {
      initialProps: { unsaved: true },
    });
    rerender({ unsaved: false });
    expect(tryToLeave()).toBe(false);
    rerender({ unsaved: true });
    expect(tryToLeave()).toBe(true);
    unmount();
    expect(tryToLeave()).toBe(false);
  });
});
