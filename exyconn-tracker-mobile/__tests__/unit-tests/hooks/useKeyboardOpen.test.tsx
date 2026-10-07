import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useKeyboardOpen } from '../../../src/hooks/useKeyboardOpen';
import { rnTest } from '../mocks/react-native/apis';

describe('useKeyboardOpen on iOS', () => {
  it('follows the keyboard as iOS announces it, before it moves', () => {
    const { result } = renderHook(() => useKeyboardOpen());
    expect(result.current).toBe(false);
    act(() => rnTest.keyboard('keyboardWillShow'));
    expect(result.current).toBe(true);
    act(() => rnTest.keyboard('keyboardWillHide'));
    expect(result.current).toBe(false);
  });

  it("does not listen for Android's after-the-fact events", () => {
    const { result } = renderHook(() => useKeyboardOpen());
    act(() => rnTest.keyboard('keyboardDidShow'));
    expect(result.current).toBe(false);
  });

  it('removes both listeners when unmounted', () => {
    const { unmount } = renderHook(() => useKeyboardOpen());
    expect(rnTest.listenerCount('keyboard', 'keyboardWillShow')).toBe(1);
    unmount();
    expect(rnTest.listenerCount('keyboard', 'keyboardWillShow')).toBe(0);
    expect(rnTest.listenerCount('keyboard', 'keyboardWillHide')).toBe(0);
  });
});
