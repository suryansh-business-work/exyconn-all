import { dueDateFor, isDue, nextOccurrence } from '../../src/modules/finance/recurrence';

const at = (iso: string) => new Date(iso);

/**
 * The local calendar date, as YYYY-MM-DD.
 *
 * Deliberately not `toISOString()`: these dates are built from local components and the
 * arithmetic is calendar arithmetic, so a UTC rendering shifts them by the runner's offset —
 * the assertion would pass in London and fail in Kolkata.
 */
const day = (date: Date): string =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');

describe('nextOccurrence', () => {
  it('adds a week, a month, a quarter and a year', () => {
    const from = at('2026-03-10T00:00:00');

    expect(day(nextOccurrence(from, 'WEEKLY'))).toBe('2026-03-17');
    expect(day(nextOccurrence(from, 'MONTHLY'))).toBe('2026-04-10');
    expect(day(nextOccurrence(from, 'QUARTERLY'))).toBe('2026-06-10');
    expect(day(nextOccurrence(from, 'YEARLY'))).toBe('2027-03-10');
  });

  it('clamps to the end of a short month instead of overflowing into the next one', () => {
    // The bug this exists to prevent: `setMonth` rolls 31 January forward to 3 March, and a
    // monthly retainer then bills in the wrong month for ever after.
    expect(day(nextOccurrence(at('2026-01-31T00:00:00'), 'MONTHLY'))).toBe('2026-02-28');
  });

  it('clamps into a leap February, not past it', () => {
    expect(day(nextOccurrence(at('2028-01-31T00:00:00'), 'MONTHLY'))).toBe('2028-02-29');
  });

  it('crosses a year boundary', () => {
    expect(day(nextOccurrence(at('2026-12-15T00:00:00'), 'MONTHLY'))).toBe('2027-01-15');
  });

  it('clamps a quarterly run off the 31st too', () => {
    // 30 November has no 31st.
    expect(day(nextOccurrence(at('2026-08-31T00:00:00'), 'QUARTERLY'))).toBe('2026-11-30');
  });

  it('keeps a 29 February yearly schedule inside the following February', () => {
    expect(day(nextOccurrence(at('2028-02-29T00:00:00'), 'YEARLY'))).toBe('2029-02-28');
  });

  it('does not mutate the date it was given', () => {
    const from = at('2026-03-10T00:00:00');
    nextOccurrence(from, 'MONTHLY');

    expect(day(from)).toBe('2026-03-10');
  });
});

describe('isDue', () => {
  const base = { active: true, nextRunAt: at('2026-03-01T00:00:00Z'), endDate: null };

  it('is due once the moment has passed, not only on the exact tick', () => {
    // A restart or a busy minute must not lose a period — a skipped month is money nobody bills.
    expect(isDue(base, at('2026-03-01T00:00:01Z'))).toBe(true);
    expect(isDue(base, at('2026-03-09T00:00:00Z'))).toBe(true);
  });

  it('is not due before its moment', () => {
    expect(isDue(base, at('2026-02-28T23:59:59Z'))).toBe(false);
  });

  it('is never due while paused', () => {
    expect(isDue({ ...base, active: false }, at('2026-04-01T00:00:00Z'))).toBe(false);
  });

  it('stops after the end date, whatever nextRunAt says', () => {
    const ended = { ...base, endDate: at('2026-02-01T00:00:00Z') };

    expect(isDue(ended, at('2026-03-02T00:00:00Z'))).toBe(false);
  });

  it('still runs inside its window', () => {
    const ending = { ...base, endDate: at('2026-03-31T00:00:00Z') };

    expect(isDue(ending, at('2026-03-15T00:00:00Z'))).toBe(true);
  });
});

describe('dueDateFor', () => {
  it('adds the payment terms to the issue date', () => {
    expect(day(dueDateFor(at('2026-03-01T00:00:00'), 30))).toBe('2026-03-31');
  });

  it('handles same-day terms', () => {
    expect(day(dueDateFor(at('2026-03-01T00:00:00'), 0))).toBe('2026-03-01');
  });
});
