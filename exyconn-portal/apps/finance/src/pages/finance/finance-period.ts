/**
 * The window the company-finance dashboard reports on.
 *
 * A finance dashboard with no stated period is the classic way to get two people arguing
 * about the same number, so the period is explicit, named, and shown on the page.
 */
export interface FinancePeriod {
  key: string;
  label: string;
  from: Date;
  to: Date;
}

/** Midnight UTC at the start of a month, `offset` months back from `now`. */
function monthStart(now: Date, offset: number): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
}

/** The last instant of the day `date` falls on, so "to" includes today. */
function endOfDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999),
  );
}

/**
 * The periods on offer. Deliberately short: a month for "how are we doing", a quarter and a
 * year for trend. Anything finer than a month makes the monthly chart a single bar.
 */
export function financePeriods(now: Date = new Date()): FinancePeriod[] {
  const to = endOfDay(now);
  return [
    { key: 'this-month', label: 'This month', from: monthStart(now, 0), to },
    { key: 'last-3', label: 'Last 3 months', from: monthStart(now, 2), to },
    { key: 'last-6', label: 'Last 6 months', from: monthStart(now, 5), to },
    { key: 'last-12', label: 'Last 12 months', from: monthStart(now, 11), to },
  ];
}

/** The period matching `key`, falling back to the first — a stale URL must not blank the page. */
export function periodFor(key: string, now: Date = new Date()): FinancePeriod {
  const periods = financePeriods(now);
  return periods.find((period) => period.key === key) ?? periods[1];
}
