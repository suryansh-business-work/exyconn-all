import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUnloadGuard } from '../../../../../src/admin/workflows/editor/useUnloadGuard';

/** Fires a cancellable beforeunload; true when something asked the browser to warn. */
function leave(): boolean {
  const event = new Event('beforeunload', { cancelable: true });
  globalThis.dispatchEvent(event);
  return event.defaultPrevented;
}

describe('useUnloadGuard', () => {
  it('lets the tab close freely while nothing is unsaved', () => {
    renderHook(() => useUnloadGuard(false));
    expect(leave()).toBe(false);
  });

  it('asks the browser to warn while there is unsaved work', () => {
    renderHook(() => useUnloadGuard(true));
    expect(leave()).toBe(true);
  });

  it('stops warning once the work is saved or the editor closes', () => {
    const { rerender, unmount } = renderHook(
      (props: { active: boolean }) => useUnloadGuard(props.active),
      { initialProps: { active: true } },
    );
    rerender({ active: false });
    expect(leave()).toBe(false);
    rerender({ active: true });
    expect(leave()).toBe(true);
    unmount();
    expect(leave()).toBe(false);
  });
});
