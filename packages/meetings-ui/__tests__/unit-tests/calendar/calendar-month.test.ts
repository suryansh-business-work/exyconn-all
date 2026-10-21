import { describe, expect, it } from 'vitest';
import {
  monthDays,
  monthParam,
  monthRange,
  readMonth,
  shiftMonth,
} from '../../../src/calendar/calendar-month';

describe('calendar month', () => {
  it('reads the month from the address, else the month today falls in', () => {
    expect(monthParam(readMonth('2026-02', '2026-10-21'))).toBe('2026-02');
    expect(monthParam(readMonth(null, '2026-10-21'))).toBe('2026-10');
    expect(monthParam(readMonth('2026-13', '2026-10-21'))).toBe('2026-10');
    expect(monthParam(readMonth('soon', '2026-10-21'))).toBe('2026-10');
  });

  it('steps a month back and forward across years', () => {
    const january = readMonth('2026-01', '2026-10-21');
    expect(monthParam(shiftMonth(january, -1))).toBe('2025-12');
    expect(monthParam(shiftMonth(january, 1))).toBe('2026-02');
  });

  it('draws whole weeks, Sunday first, marking the days outside the month', () => {
    const days = monthDays(readMonth('2026-10', '2026-10-21'));
    expect(days).toHaveLength(35);
    expect(days[0]).toMatchObject({ key: '2026-09-27', inMonth: false });
    expect(days[4]).toMatchObject({ key: '2026-10-01', inMonth: true });
    expect(days.at(-1)).toMatchObject({ key: '2026-10-31', inMonth: true });
    expect(monthDays(readMonth('2026-08', '2026-10-21'))).toHaveLength(42);
  });

  it('asks the server for the month in UTC with a day either side', () => {
    expect(monthRange(readMonth('2026-12', '2026-10-21'))).toEqual({
      from: '2026-11-30T00:00:00.000Z',
      to: '2027-01-02T00:00:00.000Z',
    });
  });
});
