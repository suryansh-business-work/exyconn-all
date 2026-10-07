import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useTrackerState } from '../../../src/hooks/useTrackerState';
import type { MobileTrackerState } from '../../../src/tracker/types';

const store = vi.hoisted(() => {
  let state: unknown = null;
  const listeners = new Set<() => void>();
  return {
    listeners,
    get: () => state,
    publish(next: unknown) {
      state = next;
      for (const listener of listeners) {
        listener();
      }
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
});

vi.mock('../../../src/tracker/instance', () => ({
  subscribe: (listener: () => void) => store.subscribe(listener),
  getSnapshot: () => store.get(),
}));

describe('useTrackerState', () => {
  it('is null until the first snapshot, then follows every publish', () => {
    const { result } = renderHook(() => useTrackerState());
    expect(result.current).toBeNull();
    const next = { status: 'idle' } as unknown as MobileTrackerState;
    act(() => store.publish(next));
    expect(result.current).toBe(next);
  });

  it('unsubscribes when unmounted', () => {
    const { unmount } = renderHook(() => useTrackerState());
    expect(store.listeners.size).toBe(1);
    unmount();
    expect(store.listeners.size).toBe(0);
  });
});
