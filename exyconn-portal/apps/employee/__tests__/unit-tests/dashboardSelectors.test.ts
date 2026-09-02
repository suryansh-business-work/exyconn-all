import { describe, it, expect } from 'vitest';
import {
  todayAttendance,
  monthAttendance,
  leaveDays,
  leaveSummary,
  upcomingHolidays,
  latestSalarySlip,
} from '../../src/pages/employee/dashboard/dashboard.selectors';

const REF = new Date('2026-03-15T10:00:00.000Z');

describe('todayAttendance', () => {
  it('finds the record for today and ignores other days', () => {
    const rows = [
      { date: '2026-03-14T09:00:00.000Z', status: 'ABSENT' as const },
      { date: '2026-03-15T09:00:00.000Z', status: 'PRESENT' as const },
    ];
    expect(todayAttendance(rows, REF)?.status).toBe('PRESENT');
  });

  it('returns null when nothing is marked today', () => {
    expect(todayAttendance([{ date: '2026-03-01T09:00:00.000Z', status: 'WFH' }], REF)).toBeNull();
  });
});

describe('monthAttendance', () => {
  it('counts only the reference month, per status', () => {
    const rows = [
      { date: '2026-03-02T09:00:00.000Z', status: 'PRESENT' as const },
      { date: '2026-03-03T09:00:00.000Z', status: 'PRESENT' as const },
      { date: '2026-03-04T09:00:00.000Z', status: 'WFH' as const },
      { date: '2026-02-27T09:00:00.000Z', status: 'PRESENT' as const },
    ];
    expect(monthAttendance(rows, REF)).toEqual({ PRESENT: 2, ABSENT: 0, WFH: 1, HALF_DAY: 0 });
  });

  it('survives an unparseable date instead of throwing', () => {
    expect(monthAttendance([{ date: 'not-a-date', status: 'PRESENT' }], REF).PRESENT).toBe(0);
  });
});

describe('leaveDays', () => {
  it('counts both end days', () => {
    expect(
      leaveDays({
        fromDate: '2026-03-02T00:00:00.000Z',
        toDate: '2026-03-04T00:00:00.000Z',
        status: 'APPROVED',
      }),
    ).toBe(3);
  });

  it('is zero when a date cannot be read', () => {
    expect(leaveDays({ fromDate: 'x', toDate: 'y', status: 'APPROVED' })).toBe(0);
  });
});

describe('leaveSummary', () => {
  it('counts pending requests and approved days inside the reference year only', () => {
    const rows = [
      { fromDate: '2026-03-02', toDate: '2026-03-03', status: 'APPROVED' as const },
      { fromDate: '2026-04-10', toDate: '2026-04-10', status: 'PENDING' as const },
      { fromDate: '2025-12-20', toDate: '2025-12-24', status: 'APPROVED' as const },
      { fromDate: '2026-01-05', toDate: '2026-01-05', status: 'REJECTED' as const },
    ];
    expect(leaveSummary(rows, REF)).toEqual({ pending: 1, approvedDays: 2 });
  });
});

describe('upcomingHolidays', () => {
  const rows = [
    { id: 'a', name: 'Past', date: '2026-01-01' },
    { id: 'b', name: 'Later', date: '2026-08-15' },
    { id: 'c', name: 'Soon', date: '2026-03-25' },
    { id: 'd', name: 'Latest', date: '2026-12-25' },
  ];

  it('returns only future holidays, soonest first, capped', () => {
    expect(upcomingHolidays(rows, REF, 2).map((h) => h.id)).toEqual(['c', 'b']);
  });

  it('does not mutate the input order', () => {
    upcomingHolidays(rows, REF);
    expect(rows.map((h) => h.id)).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('latestSalarySlip', () => {
  it('picks the newest by year then month', () => {
    const slips = [
      { month: 12, year: 2025 },
      { month: 2, year: 2026 },
      { month: 11, year: 2025 },
    ];
    expect(latestSalarySlip(slips)).toEqual({ month: 2, year: 2026 });
  });

  it('is null when there are no slips', () => {
    expect(latestSalarySlip([])).toBeNull();
  });
});
