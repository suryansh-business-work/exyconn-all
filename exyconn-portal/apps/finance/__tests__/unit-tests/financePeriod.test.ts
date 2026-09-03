import { describe, it, expect } from 'vitest';
import { financePeriods, periodFor } from '../../src/pages/finance/finance-period';

const NOW = new Date('2026-09-04T10:30:00.000Z');

describe('financePeriods', () => {
  it('starts this month at the first of the month, not 30 days ago', () => {
    const [thisMonth] = financePeriods(NOW);
    expect(thisMonth.from.toISOString()).toBe('2026-09-01T00:00:00.000Z');
  });

  it('counts a 3-month window as three whole months, not 90 days', () => {
    // Jul, Aug, Sep — so the monthly chart has three points, one per month.
    expect(periodFor('last-3', NOW).from.toISOString()).toBe('2026-07-01T00:00:00.000Z');
  });

  it('crosses a year boundary cleanly', () => {
    const period = periodFor('last-6', new Date('2026-02-10T00:00:00.000Z'));
    expect(period.from.toISOString()).toBe('2025-09-01T00:00:00.000Z');
  });

  it('runs to the end of today, so a bill recorded this morning is counted', () => {
    expect(periodFor('this-month', NOW).to.toISOString()).toBe('2026-09-04T23:59:59.999Z');
  });

  it('falls back rather than blanking the page on an unknown period', () => {
    expect(periodFor('nonsense', NOW).key).toBe('last-3');
  });
});
