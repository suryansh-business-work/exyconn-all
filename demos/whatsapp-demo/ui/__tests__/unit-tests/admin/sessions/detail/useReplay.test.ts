import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useReplay } from '../../../../../src/admin/sessions/detail/useReplay';

const STEP_MS = 1200;

function mount(count = 3) {
  return renderHook(() => useReplay(count));
}

const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('useReplay', () => {
  it('starts idle, with no event current', () => {
    const { result } = mount();
    expect(result.current.index).toBe(-1);
    expect(result.current.playing).toBe(false);
  });

  it('plays from the first event, one step at a time, and stops on the last', () => {
    const { result } = mount(3);
    act(() => result.current.play());
    expect(result.current).toMatchObject({ index: 0, playing: true });
    advance(STEP_MS - 1);
    expect(result.current.index).toBe(0);
    advance(1);
    expect(result.current.index).toBe(1);
    advance(STEP_MS);
    expect(result.current).toMatchObject({ index: 2, playing: false });
    advance(STEP_MS * 3);
    expect(result.current.index).toBe(2);
  });

  it('starts over when played again from the end', () => {
    const { result } = mount(2);
    act(() => result.current.next());
    act(() => result.current.next());
    expect(result.current.index).toBe(1);
    act(() => result.current.play());
    expect(result.current).toMatchObject({ index: 0, playing: true });
  });

  it('plays on from where a hand-stepped replay stands', () => {
    const { result } = mount(4);
    act(() => result.current.next());
    act(() => result.current.next());
    act(() => result.current.play());
    expect(result.current).toMatchObject({ index: 1, playing: true });
  });

  it('pauses where it is', () => {
    const { result } = mount(3);
    act(() => result.current.play());
    act(() => result.current.pause());
    advance(STEP_MS * 2);
    expect(result.current).toMatchObject({ index: 0, playing: false });
  });

  it('steps by hand within the events, pausing a running replay', () => {
    const { result } = mount(2);
    act(() => result.current.previous());
    expect(result.current.index).toBe(0);
    act(() => result.current.play());
    act(() => result.current.next());
    expect(result.current).toMatchObject({ index: 1, playing: false });
    act(() => result.current.next());
    expect(result.current.index).toBe(1);
    act(() => result.current.previous());
    act(() => result.current.previous());
    expect(result.current.index).toBe(0);
  });

  it('stops and goes back to idle on reset', () => {
    const { result } = mount(3);
    act(() => result.current.play());
    advance(STEP_MS);
    act(() => result.current.reset());
    expect(result.current).toMatchObject({ index: -1, playing: false });
    advance(STEP_MS * 2);
    expect(result.current.index).toBe(-1);
  });

  it('clears its timer when the timeline goes away mid-replay', () => {
    const clear = vi.spyOn(globalThis, 'clearTimeout');
    const { result, unmount } = mount(3);
    act(() => result.current.play());
    unmount();
    expect(clear).toHaveBeenCalled();
    clear.mockRestore();
  });
});
