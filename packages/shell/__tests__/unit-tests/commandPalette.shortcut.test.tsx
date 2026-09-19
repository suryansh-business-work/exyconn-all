import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, it } from 'vitest';
import { useCommandPalette } from '@/layout/CommandPalette/useCommandPalette';

/** Presses a key with a modifier, the way a browser reports it. */
function press(key: string, modifier: 'metaKey' | 'ctrlKey' | 'none' = 'metaKey') {
  act(() => {
    globalThis.dispatchEvent(
      new KeyboardEvent('keydown', {
        key,
        metaKey: modifier === 'metaKey',
        ctrlKey: modifier === 'ctrlKey',
        cancelable: true,
      }),
    );
  });
}

describe('the palette shortcut', () => {
  it('opens on Cmd+K and closes on it again', () => {
    const { result } = renderHook(() => useCommandPalette());

    press('k');
    expect(result.current.open).toBe(true);

    press('k');
    expect(result.current.open).toBe(false);
  });

  it('opens on Ctrl+K, for everybody not on a Mac', () => {
    const { result } = renderHook(() => useCommandPalette());

    press('K', 'ctrlKey');

    expect(result.current.open).toBe(true);
  });

  it('ignores the key on its own', () => {
    const { result } = renderHook(() => useCommandPalette());

    press('k', 'none');

    expect(result.current.open).toBe(false);
  });

  it('stops listening once it is gone', () => {
    const { result, unmount } = renderHook(() => useCommandPalette());
    unmount();

    press('k');

    expect(result.current.open).toBe(false);
  });
});
