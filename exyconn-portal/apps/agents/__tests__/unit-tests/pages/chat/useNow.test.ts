import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useNow } from '../../../../src/pages/chat/useNow';

const START = new Date('2026-10-01T10:00:00.000Z').getTime();

describe('useNow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(START);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ticks forward every interval', () => {
    const { result } = renderHook(() => useNow(1000));
    expect(result.current).toBe(START);

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toBe(START + 1000);

    act(() => vi.advanceTimersByTime(2000));
    expect(result.current).toBe(START + 3000);
  });

  it('stays idle while not active, and catches up when switched on', () => {
    const { result, rerender } = renderHook(({ active }) => useNow(1000, active), {
      initialProps: { active: false },
    });

    act(() => vi.advanceTimersByTime(5000));
    expect(result.current).toBe(START);

    rerender({ active: true });
    expect(result.current).toBe(START + 5000);
  });

  it('stops ticking once unmounted', () => {
    const clear = vi.spyOn(globalThis, 'clearInterval');
    const { unmount } = renderHook(() => useNow(1000));
    unmount();
    expect(clear).toHaveBeenCalled();
    clear.mockRestore();
  });
});
