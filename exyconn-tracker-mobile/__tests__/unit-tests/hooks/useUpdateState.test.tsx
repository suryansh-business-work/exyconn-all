import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useUpdateState } from '../../../src/hooks/useUpdateState';
import type { MobileUpdateState } from '../../../src/tracker/updates';

const store = vi.hoisted(() => {
  let state: unknown = { stage: 'idle', version: '', url: '', lastCheckedAt: null };
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

vi.mock('../../../src/tracker/updates', () => ({
  subscribeUpdate: (listener: () => void) => store.subscribe(listener),
  getUpdate: () => store.get(),
}));

describe('useUpdateState', () => {
  it("follows the install's update cycle", () => {
    const { result } = renderHook(() => useUpdateState());
    expect(result.current.stage).toBe('idle');
    const available: MobileUpdateState = {
      stage: 'available',
      version: '2.0.0',
      url: 'https://example.test/app.apk',
      lastCheckedAt: '2026-09-11T10:00:00.000Z',
    };
    act(() => store.publish(available));
    expect(result.current).toBe(available);
  });

  it('unsubscribes when unmounted', () => {
    const { unmount } = renderHook(() => useUpdateState());
    expect(store.listeners.size).toBe(1);
    unmount();
    expect(store.listeners.size).toBe(0);
  });
});
