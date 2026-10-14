import { describe, expect, it } from 'vitest';
import { useWaFormat } from '../../../src/hooks/useWaFormat';
import { renderHookWithProviders } from '../test-utils';

/** 6 October 2026, 12:00 UTC — the providers' default zone is UTC. */
const NOON = Date.UTC(2026, 9, 6, 12, 0);

describe('useWaFormat', () => {
  it("formats dates and times with the workspace's patterns", () => {
    const { result } = renderHookWithProviders(() => useWaFormat());
    expect(result.current.date(NOON)).toBe('06 Oct 2026');
    expect(result.current.time(NOON)).toBe('12:00 PM');
  });

  it('writes a short weekday and date for slot pickers', () => {
    const { result } = renderHookWithProviders(() => useWaFormat());
    expect(result.current.day(NOON)).toBe('Tue, Oct 6');
  });

  it('writes demo prices in whole rupees', () => {
    const { result } = renderHookWithProviders(() => useWaFormat());
    expect(result.current.money(1499.6)).toBe('₹1,500');
  });

  it('keeps the same formatters across renders', () => {
    const { result, rerender } = renderHookWithProviders(() => useWaFormat());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
