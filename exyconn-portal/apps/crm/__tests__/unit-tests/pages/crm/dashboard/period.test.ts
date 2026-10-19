import { describe, expect, it } from 'vitest';
import { dayValue, periodRange, readPeriod } from '../../../../../src/pages/crm/dashboard/period';

const NOW = new Date('2026-10-19T12:00:00.000Z');
const read = (search: string) => readPeriod(new URLSearchParams(search));

describe('the overview period', () => {
  it('defaults to this month and ignores a period it does not know', () => {
    expect(read('')).toEqual({ kind: 'month', fromDay: '', toDay: '' });
    expect(read('?period=decade').kind).toBe('month');
    expect(read('?period=custom&from=2026-01-01&to=2026-01-31')).toEqual({
      kind: 'custom',
      fromDay: '2026-01-01',
      toDay: '2026-01-31',
    });
  });

  it('reads this month, quarter and year in the company zone, not the browser’s', () => {
    const month = periodRange(read('?period=month'), NOW, 'Asia/Kolkata');
    const quarter = periodRange(read('?period=quarter'), NOW, 'Asia/Kolkata');
    const year = periodRange(read('?period=year'), NOW, 'UTC');

    // Midnight on 1 October in Kolkata is 18:30 UTC on 30 September.
    expect(month?.from.toISOString()).toBe('2026-09-30T18:30:00.000Z');
    expect(month?.to.toISOString()).toBe('2026-10-31T18:30:00.000Z');
    expect(quarter?.from.toISOString()).toBe('2026-09-30T18:30:00.000Z');
    expect(quarter?.to.toISOString()).toBe('2026-12-31T18:30:00.000Z');
    expect(year).toEqual({
      from: new Date('2026-01-01T00:00:00.000Z'),
      to: new Date('2027-01-01T00:00:00.000Z'),
    });
  });

  it('runs a custom period to the end of its last day', () => {
    const range = periodRange(read('?period=custom&from=2026-03-01&to=2026-03-31'), NOW, 'UTC');

    expect(range).toEqual({
      from: new Date('2026-03-01T00:00:00.000Z'),
      to: new Date('2026-04-01T00:00:00.000Z'),
    });
  });

  it('asks for nothing until a custom period has both days, in order', () => {
    expect(periodRange(read('?period=custom&from=2026-03-01'), NOW, 'UTC')).toBeNull();
    expect(
      periodRange(read('?period=custom&from=2026-03-02&to=2026-03-01'), NOW, 'UTC'),
    ).toBeNull();
    expect(periodRange(read('?period=custom&from=nope&to=2026-03-01'), NOW, 'UTC')).toBeNull();
  });

  it('turns only real days into picker values', () => {
    expect(dayValue('')).toBeNull();
    expect(dayValue('2026-13-40')).toBeNull();
    expect(dayValue('2026-02-03')?.getDate()).toBe(3);
  });
});
