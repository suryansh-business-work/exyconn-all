// @vitest-environment jsdom
/** Whole seconds until a deadline, ticking every second. */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCountdown } from "../../../../../src/components/chat-embed/hooks/useCountdown";

const NOW = new Date("2026-10-07T10:00:00.000Z");
const inSeconds = (seconds: number) => new Date(NOW.getTime() + seconds * 1000).toISOString();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useCountdown", () => {
  it("is null without a deadline and starts no timer", () => {
    const { result } = renderHook(() => useCountdown(null));
    expect(result.current).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("is null for a deadline that is not a date", () => {
    const { result } = renderHook(() => useCountdown("not a date"));
    expect(result.current).toBeNull();
  });

  it("counts down once a second and stops at zero", () => {
    const { result } = renderHook(() => useCountdown(inSeconds(3)));
    expect(result.current).toBe(3);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toBe(2);
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current).toBe(0);
  });

  it("is zero for a deadline already passed", () => {
    const { result } = renderHook(() => useCountdown(inSeconds(-30)));
    expect(result.current).toBe(0);
  });

  it("restarts from a new deadline and goes quiet when it is removed", () => {
    const initialProps: { iso: string | null } = { iso: inSeconds(10) };
    const { result, rerender } = renderHook(({ iso }) => useCountdown(iso), { initialProps });
    expect(result.current).toBe(10);
    rerender({ iso: inSeconds(90) });
    expect(result.current).toBe(90);
    rerender({ iso: null });
    expect(result.current).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("stops ticking when unmounted", () => {
    const { unmount } = renderHook(() => useCountdown(inSeconds(60)));
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
