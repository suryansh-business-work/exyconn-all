import { describe, it, expect } from 'vitest';
import { buildAttendanceMonth } from '../../src/pages/employee/attendance-calendar/attendanceDays';

const month = new Date(2026, 8, 1); // September 2026
const today = new Date(2026, 8, 19);
/** A local day as the date picker stores it: local midnight, in ISO. */
const local = (day: number) => new Date(2026, 8, day).toISOString();

const statusOn = (days: ReturnType<typeof buildAttendanceMonth>, day: number) =>
  days.find((d) => d.key === `2026-09-${String(day).padStart(2, '0')}`)?.status;

describe('buildAttendanceMonth', () => {
  const days = buildAttendanceMonth(
    month,
    [
      // Attendance is stored at midnight UTC of the employee's own day.
      { date: '2026-09-01T00:00:00.000Z', status: 'PRESENT' },
      { date: '2026-09-02T00:00:00.000Z', status: 'WFH' },
      { date: '2026-09-03T00:00:00.000Z', status: 'ABSENT' },
      { date: '2026-09-15T00:00:00.000Z', status: 'PRESENT' },
    ],
    [
      { fromDate: local(7), toDate: local(9), status: 'PENDING' },
      { fromDate: local(10), toDate: local(10), status: 'REJECTED' },
      { fromDate: local(9), toDate: local(9), status: 'APPROVED' },
    ],
    [
      { date: local(15), name: 'Founders Day' },
      { date: local(16), name: 'Onam' },
    ],
    today,
  );

  it('shows marked attendance, and absence apart from it', () => {
    expect(statusOn(days, 1)).toBe('PRESENT');
    expect(statusOn(days, 2)).toBe('PRESENT');
    expect(statusOn(days, 3)).toBe('ABSENT');
  });

  it('colours every day of a leave, the approved one winning an overlap', () => {
    expect([7, 8, 9, 10].map((day) => statusOn(days, day))).toEqual([
      'LEAVE_PENDING',
      'LEAVE_PENDING',
      'LEAVE_APPROVED',
      'LEAVE_REJECTED',
    ]);
  });

  it('shows a holiday, unless attendance was marked on it', () => {
    expect(statusOn(days, 16)).toBe('HOLIDAY');
    expect(statusOn(days, 15)).toBe('PRESENT');
    expect(days.find((d) => d.key === '2026-09-15')?.holiday).toBe('Founders Day');
  });

  it('lays out whole weeks and marks today', () => {
    expect(days).toHaveLength(35);
    expect(days.filter((d) => d.isToday).map((d) => d.key)).toEqual(['2026-09-19']);
    expect(statusOn(days, 20)).toBe('NONE');
  });
});
