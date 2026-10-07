import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useTypingSignal } from '../../../../../../src/pages/chat/forms/chat-reply/useTypingSignal';

function renderSignal() {
  const signal = vi.fn<(on: boolean) => void>();
  const hook = renderHook(({ send }) => useTypingSignal(send), { initialProps: { send: signal } });
  return { signal, ...hook };
}

const later = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe('useTypingSignal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-01T10:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('says "typing" on the first key and "stopped" after a pause', () => {
    const { signal, result } = renderSignal();
    act(() => result.current.typed());
    expect(signal.mock.calls).toEqual([[true]]);

    later(2999);
    expect(signal).toHaveBeenCalledTimes(1);
    later(1);
    expect(signal.mock.calls).toEqual([[true], [false]]);
  });

  it('repeats "typing" at most every few seconds while the agent keeps going', () => {
    const { signal, result } = renderSignal();
    act(() => result.current.typed());
    later(2500);
    act(() => result.current.typed());
    expect(signal).toHaveBeenCalledTimes(1);

    later(600);
    act(() => result.current.typed());
    expect(signal.mock.calls).toEqual([[true], [true]]);
  });

  it('says "stopped" at once on send, and only once', () => {
    const { signal, result } = renderSignal();
    act(() => result.current.typed());
    act(() => result.current.stopped());
    act(() => result.current.stopped());
    later(5000);

    expect(signal.mock.calls).toEqual([[true], [false]]);
  });

  it('sends nothing on send when the agent never typed', () => {
    const { signal, result } = renderSignal();
    act(() => result.current.stopped());
    expect(signal).not.toHaveBeenCalled();
  });

  it('says "stopped" when the page closes mid-reply', () => {
    const { signal, result, unmount } = renderSignal();
    act(() => result.current.typed());
    unmount();
    expect(signal.mock.calls).toEqual([[true], [false]]);
  });

  it('always signals through the latest callback', () => {
    const { signal, result, rerender } = renderSignal();
    const next = vi.fn<(on: boolean) => void>();
    rerender({ send: next });
    act(() => result.current.typed());

    expect(signal).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(true);
  });
});
