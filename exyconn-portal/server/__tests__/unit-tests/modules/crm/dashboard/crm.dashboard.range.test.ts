import {
  dashboardWindow,
  granularityOf,
  periodsBetween,
} from '../../../../../src/modules/crm/dashboard/crm.dashboard.range';

const at = (iso: string) => new Date(iso);

describe('the dashboard period', () => {
  it('refuses a period that runs backwards, is not a date, or is longer than three years', () => {
    expect(() => dashboardWindow(at('2026-02-01'), at('2026-01-01'))).toThrow(
      'Choose a period that ends after it starts.',
    );
    expect(() => dashboardWindow('later', at('2026-01-01'))).toThrow('Choose a period');
    expect(() => dashboardWindow(at('2020-01-01'), at('2026-01-01'))).toThrow(
      'at most three years',
    );
  });

  it('charts a month by day, a quarter by week and a year by month', () => {
    expect(granularityOf(at('2026-10-01'), at('2026-11-01'))).toBe('DAY');
    expect(granularityOf(at('2026-10-01'), at('2027-01-01'))).toBe('WEEK');
    expect(granularityOf(at('2026-01-01'), at('2027-01-01'))).toBe('MONTH');
  });

  it('lists every day of a month in the company zone, quiet days included', () => {
    // Midnight of 1 Oct in Kolkata is 18:30 UTC the day before.
    const periods = periodsBetween(
      at('2026-09-30T18:30:00Z'),
      at('2026-10-31T18:30:00Z'),
      'DAY',
      'Asia/Kolkata',
    );

    expect(periods).toHaveLength(31);
    expect(periods[0].key).toBe('2026-10-01');
    expect(periods.at(-1)?.key).toBe('2026-10-31');
  });

  it('never skips the short day when the clocks go forward', () => {
    // New York springs forward on 8 March 2026, a 23-hour day.
    const periods = periodsBetween(
      at('2026-03-01T05:00:00Z'),
      at('2026-04-01T04:00:00Z'),
      'DAY',
      'America/New_York',
    );

    expect(periods.map((period) => period.key)).toContain('2026-03-08');
    expect(periods).toHaveLength(31);
  });

  it('keys weeks by ISO week, so the week across New Year is one bar', () => {
    const periods = periodsBetween(
      at('2025-12-29T00:00:00Z'),
      at('2026-01-12T00:00:00Z'),
      'WEEK',
      'UTC',
    );

    expect(periods.map((period) => period.key)).toEqual(['2026-W01', '2026-W02']);
  });

  it('keys months by year and month', () => {
    const periods = periodsBetween(
      at('2026-01-01T00:00:00Z'),
      at('2026-04-01T00:00:00Z'),
      'MONTH',
      'UTC',
    );

    expect(periods.map((period) => period.key)).toEqual(['2026-01', '2026-02', '2026-03']);
  });
});
