import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useKeyboardOpen } from '../../../src/hooks/useKeyboardOpen';
import { rnTest } from '../mocks/react-native/apis';

// The event names are picked when the module loads, so the platform is Android from the start.
vi.mock('react-native', async (importOriginal) => {
  const actual = await importOriginal<{ Platform: object }>();
  return { ...actual, Platform: { ...actual.Platform, OS: 'android' } };
});

describe('useKeyboardOpen on Android', () => {
  it('follows the keyboard once Android says it has moved', () => {
    const { result } = renderHook(() => useKeyboardOpen());
    act(() => rnTest.keyboard('keyboardDidShow'));
    expect(result.current).toBe(true);
    act(() => rnTest.keyboard('keyboardDidHide'));
    expect(result.current).toBe(false);
  });

  it('ignores the iOS-only will-show event', () => {
    const { result } = renderHook(() => useKeyboardOpen());
    act(() => rnTest.keyboard('keyboardWillShow'));
    expect(result.current).toBe(false);
  });
});
