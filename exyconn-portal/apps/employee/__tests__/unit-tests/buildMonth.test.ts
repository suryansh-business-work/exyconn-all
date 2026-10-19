import { describe, it, expect } from 'vitest';
import { isSameDay } from 'date-fns';
import { buildMonthDays } from '../../src/pages/employee/calendar/buildMonth';

// Fixed reference month so assertions never depend on the wall clock. Local-time
// ('T00:00:00', no 'Z') date strings keep the grid comparisons timezone-stable.
const month = new Date(2026, 0, 15); // January 2026
const today = new Date(2026, 0, 15);

const dayFor = (days: ReturnType<typeof buildMonthDays>, date: Date) =>
  days.find((d) => isSameDay(d.date, date));

describe('buildMonthDays', () => {
  it('returns a full grid of whole weeks (>= 28 days)', () => {
    const days = buildMonthDays(month, [], [], today);
    expect(days.length % 7).toBe(0);
    expect(days.length).toBeGreaterThanOrEqual(28);
  });

  it('marks a holiday name on its own day only', () => {
    const holidays = [{ date: '2026-01-15T00:00:00', name: 'Makar Sankranti' }];
    const days = buildMonthDays(month, holidays, [], today);
    expect(dayFor(days, new Date(2026, 0, 15))?.holiday).toBe('Makar Sankranti');
    expect(dayFor(days, new Date(2026, 0, 16))?.holiday).toBeUndefined();
  });

  it('flags days inside a leave interval (inclusive) and not outside', () => {
    const leaves = [{ fromDate: '2026-01-10T00:00:00', toDate: '2026-01-12T00:00:00' }];
    const days = buildMonthDays(month, [], leaves, today);
    expect(dayFor(days, new Date(2026, 0, 10))?.onLeave).toBe(true); // start
    expect(dayFor(days, new Date(2026, 0, 11))?.onLeave).toBe(true); // inside
    expect(dayFor(days, new Date(2026, 0, 12))?.onLeave).toBe(true); // end
    expect(dayFor(days, new Date(2026, 0, 13))?.onLeave).toBe(false); // outside
  });

  it('marks days outside the visible month with inMonth=false', () => {
    const days = buildMonthDays(month, [], [], today);
    expect(days.some((d) => !d.inMonth)).toBe(true);
    expect(dayFor(days, new Date(2025, 11, 28))?.inMonth).toBe(false); // leading Dec 28
    expect(dayFor(days, new Date(2026, 0, 15))?.inMonth).toBe(true);
  });

  it('ignores inverted leave ranges (toDate before fromDate)', () => {
    const leaves = [{ fromDate: '2026-01-20T00:00:00', toDate: '2026-01-18T00:00:00' }];
    const days = buildMonthDays(month, [], leaves, today);
    expect(days.some((d) => d.onLeave)).toBe(false);
  });

  it('sets isToday on the matching day only', () => {
    const days = buildMonthDays(month, [], [], today);
    expect(days.filter((d) => d.isToday)).toHaveLength(1);
    expect(dayFor(days, today)?.isToday).toBe(true);
  });
});

describe('buildMonthDays week off and leave codes', () => {
  it('flags the days outside the working week, and none until the week is known', () => {
    // 17 and 18 January 2026 are a Saturday and a Sunday.
    const days = buildMonthDays(month, [], [], today, [1, 2, 3, 4, 5]);
    expect(dayFor(days, new Date(2026, 0, 16))?.weekOff).toBe(false);
    expect(dayFor(days, new Date(2026, 0, 17))?.weekOff).toBe(true);
    expect(dayFor(days, new Date(2026, 0, 18))?.weekOff).toBe(true);
    expect(buildMonthDays(month, [], [], today).some((d) => d.weekOff)).toBe(false);
  });

  it('follows a week of the employee own, such as Sunday to Thursday', () => {
    const days = buildMonthDays(month, [], [], today, [0, 1, 2, 3, 4]);
    expect(dayFor(days, new Date(2026, 0, 16))?.weekOff).toBe(true);
    expect(dayFor(days, new Date(2026, 0, 18))?.weekOff).toBe(false);
  });

  it('carries the code of the first leave on a day, and none without leave', () => {
    const leaves = [
      { fromDate: '2026-01-10T00:00:00', toDate: '2026-01-12T00:00:00', type: 'CL' },
      { fromDate: '2026-01-12T00:00:00', toDate: '2026-01-13T00:00:00', type: 'EL' },
    ];
    const days = buildMonthDays(month, [], leaves, today);
    expect(dayFor(days, new Date(2026, 0, 12))?.leaveType).toBe('CL');
    expect(dayFor(days, new Date(2026, 0, 13))?.leaveType).toBe('EL');
    expect(dayFor(days, new Date(2026, 0, 14))?.leaveType).toBeUndefined();
  });
});
