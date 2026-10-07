import { nextOccurrence } from '../../../../src/modules/finance/recurrence';
import { RECURRENCE_FREQUENCIES } from '../../../../src/modules/finance/recurring-invoice.model';

/** The local calendar date — the arithmetic is on local components, as in recurrence.ts. */
const day = (date: Date): string =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');

describe('nextOccurrence for a frequency it does not know', () => {
  it('advances one month, clamped, rather than standing still', () => {
    const unknown = 'FORTNIGHTLY' as (typeof RECURRENCE_FREQUENCIES)[number];

    expect(day(nextOccurrence(new Date(2026, 0, 31), unknown))).toBe('2026-02-28');
    expect(day(nextOccurrence(new Date(2026, 4, 10), unknown))).toBe('2026-06-10');
  });

  it('keeps the time of day it was given', () => {
    const from = new Date(2026, 2, 10, 9, 30);

    const next = nextOccurrence(from, 'MONTHLY');

    expect([next.getHours(), next.getMinutes()]).toEqual([9, 30]);
    expect(RECURRENCE_FREQUENCIES).toEqual(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']);
  });
});
