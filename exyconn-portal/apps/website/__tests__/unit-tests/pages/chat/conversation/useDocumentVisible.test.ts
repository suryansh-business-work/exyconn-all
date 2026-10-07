import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDocumentVisible } from '../../../../../src/pages/chat/conversation/useDocumentVisible';

let visibility: DocumentVisibilityState = 'visible';

function switchTab(next: DocumentVisibilityState) {
  visibility = next;
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

describe('useDocumentVisible', () => {
  afterEach(() => {
    Reflect.deleteProperty(document, 'visibilityState');
  });

  it('follows the tab going to the background and coming back', () => {
    visibility = 'visible';
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibility,
    });
    const { result } = renderHook(() => useDocumentVisible());
    expect(result.current).toBe(true);

    switchTab('hidden');
    expect(result.current).toBe(false);

    switchTab('visible');
    expect(result.current).toBe(true);
  });

  it('stops listening once unmounted', () => {
    const remove = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useDocumentVisible());
    unmount();

    expect(remove).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    remove.mockRestore();
  });
});
