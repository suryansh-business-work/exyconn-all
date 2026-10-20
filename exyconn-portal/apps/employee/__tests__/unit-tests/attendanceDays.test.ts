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

describe('buildAttendanceMonth leave edge cases', () => {
  const build = (leaves: { fromDate: string; toDate: string; status: string }[]) =>
    buildAttendanceMonth(month, [], leaves, [], today);

  it('keeps an approved leave when a weaker one is listed after it', () => {
    const days = build([
      { fromDate: local(9), toDate: local(9), status: 'APPROVED' },
      { fromDate: local(9), toDate: local(9), status: 'PENDING' },
    ]);

    expect(statusOn(days, 9)).toBe('LEAVE_APPROVED');
  });

  it('ignores a leave whose status the calendar does not know', () => {
    const days = build([{ fromDate: local(9), toDate: local(9), status: 'CANCELLED' }]);

    expect(statusOn(days, 9)).toBe('NONE');
  });

  it('ignores a leave that ends before it starts', () => {
    const days = build([{ fromDate: local(12), toDate: local(10), status: 'APPROVED' }]);

    expect([10, 11, 12].map((day) => statusOn(days, day))).toEqual(['NONE', 'NONE', 'NONE']);
  });
});

describe('buildAttendanceMonth week off, holiday names and leave codes', () => {
  // September 2026 opens on a Tuesday: the 5th, 6th, 12th and 13th are a weekend.
  const MONDAY_TO_FRIDAY = [1, 2, 3, 4, 5];
  const dayOn = (days: ReturnType<typeof buildAttendanceMonth>, day: number) =>
    days.find((d) => d.key === `2026-09-${String(day).padStart(2, '0')}`);

  it('marks the days outside the working week, and none until the week is known', () => {
    const withWeek = buildAttendanceMonth(month, [], [], [], today, MONDAY_TO_FRIDAY);
    expect([4, 5, 6, 7].map((day) => statusOn(withWeek, day))).toEqual([
      'NONE',
      'WEEK_OFF',
      'WEEK_OFF',
      'NONE',
    ]);
    const unknown = buildAttendanceMonth(month, [], [], [], today);
    expect(unknown.some((d) => d.status === 'WEEK_OFF')).toBe(false);
  });

  it('marks every day a week off when nobody works any day', () => {
    const days = buildAttendanceMonth(month, [], [], [], today, []);
    expect(days.every((d) => d.status === 'WEEK_OFF')).toBe(true);
  });

  it('reads a day as attendance, then a holiday, then the week off, then leave', () => {
    const days = buildAttendanceMonth(
      month,
      [{ date: '2026-09-13T00:00:00.000Z', status: 'PRESENT' }],
      [{ type: 'CL', fromDate: local(4), toDate: local(14), status: 'APPROVED' }],
      [{ date: local(12), name: 'Founders Day' }],
      today,
      MONDAY_TO_FRIDAY,
    );
    expect(statusOn(days, 13)).toBe('PRESENT');
    expect(statusOn(days, 12)).toBe('HOLIDAY');
    expect(statusOn(days, 6)).toBe('WEEK_OFF');
    expect(statusOn(days, 7)).toBe('LEAVE_APPROVED');
  });

  it('carries the leave code only on a day that shows the leave', () => {
    const days = buildAttendanceMonth(
      month,
      [],
      [{ type: 'EL', fromDate: local(4), toDate: local(7), status: 'PENDING' }],
      [],
      today,
      MONDAY_TO_FRIDAY,
    );
    expect(dayOn(days, 4)?.leaveType).toBe('EL');
    expect(dayOn(days, 5)?.leaveType).toBeUndefined();
    expect(dayOn(days, 7)?.leaveType).toBe('EL');
  });

  it('takes the code of the leave that wins the day', () => {
    const days = buildAttendanceMonth(
      month,
      [],
      [
        { type: 'CL', fromDate: local(9), toDate: local(9), status: 'PENDING' },
        { type: 'SL', fromDate: local(9), toDate: local(9), status: 'APPROVED' },
      ],
      [],
      today,
    );
    expect(dayOn(days, 9)).toMatchObject({ status: 'LEAVE_APPROVED', leaveType: 'SL' });
  });

  it('keeps the holiday name on the day whatever it shows', () => {
    const days = buildAttendanceMonth(
      month,
      [{ date: '2026-09-15T00:00:00.000Z', status: 'ABSENT' }],
      [],
      [
        { date: local(15), name: 'Onam' },
        { date: local(16), name: 'Milad' },
      ],
      today,
    );
    expect(dayOn(days, 15)).toMatchObject({ status: 'ABSENT', holiday: 'Onam' });
    expect(dayOn(days, 16)).toMatchObject({ status: 'HOLIDAY', holiday: 'Milad' });
    expect(dayOn(days, 17)?.holiday).toBeUndefined();
  });
});
