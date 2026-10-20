import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with the value it was given', () => {
    const { result } = renderHook(() => useDebouncedValue('ada', 300));
    expect(result.current).toBe('ada');
  });

  it('settles only once typing has paused for the delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'a' },
    });
    rerender({ value: 'ad' });
    act(() => vi.advanceTimersByTime(200));
    rerender({ value: 'ada' });
    act(() => vi.advanceTimersByTime(299));
    // Each keystroke restarted the wait, so the first value still stands.
    expect(result.current).toBe('a');
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe('ada');
  });

  it('drops the pending update when unmounted', () => {
    const clear = vi.spyOn(globalThis, 'clearTimeout');
    const { rerender, unmount } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 1 },
    });
    rerender({ value: 2 });
    unmount();
    expect(clear).toHaveBeenCalled();
    expect(() => act(() => vi.advanceTimersByTime(300))).not.toThrow();
    clear.mockRestore();
  });
});
