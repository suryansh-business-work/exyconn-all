import { describe, expect, it, vi } from 'vitest';
import { monthToDate } from '../../../../src/pages/ai/ai.period';

describe('monthToDate', () => {
  it('spans from the first instant of the month to its last, not to now', () => {
    const now = new Date(2026, 1, 14, 9, 30);
    const { from, to } = monthToDate(now);
    expect(from).toBe(new Date(2026, 1, 1, 0, 0, 0, 0).toISOString());
    expect(to).toBe(new Date(2026, 1, 28, 23, 59, 59, 999).toISOString());
  });

  it('handles a leap February and the last day of a month', () => {
    const { from, to } = monthToDate(new Date(2028, 1, 29, 23, 59));
    expect(from).toBe(new Date(2028, 1, 1).toISOString());
    expect(to).toBe(new Date(2028, 1, 29, 23, 59, 59, 999).toISOString());
  });

  it('defaults to the current month', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 7, 12));
    try {
      expect(monthToDate()).toEqual({
        from: new Date(2026, 9, 1).toISOString(),
        to: new Date(2026, 9, 31, 23, 59, 59, 999).toISOString(),
      });
    } finally {
      vi.useRealTimers();
    }
  });
});
