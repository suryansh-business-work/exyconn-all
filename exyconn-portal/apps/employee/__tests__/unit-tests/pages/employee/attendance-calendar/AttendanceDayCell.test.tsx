import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test-utils';
import { AttendanceDayCell } from '../../../../../src/pages/employee/attendance-calendar/AttendanceDayCell';
import type { AttendanceDay } from '../../../../../src/pages/employee/attendance-calendar/attendanceDays';

const day = (overrides: Partial<AttendanceDay>): AttendanceDay => ({
  date: new Date(2026, 8, 7),
  key: '2026-09-07',
  inMonth: true,
  isToday: false,
  status: 'NONE',
  ...overrides,
});

describe('AttendanceDayCell', () => {
  it('shows just the date on a day with nothing on it', () => {
    renderWithProviders(<AttendanceDayCell day={day({})} />);
    const cell = screen.getByLabelText('7 September');
    expect(cell).toHaveTextContent(/^7$/);
  });

  it('writes the status on the day, so the colour is never the only signal', () => {
    renderWithProviders(
      <AttendanceDayCell day={day({ status: 'LEAVE_PENDING', isToday: true })} />,
    );
    const cell = screen.getByLabelText('7 September, Leave requested');
    expect(cell).toHaveTextContent(/^7Leave requested$/);
  });

  it('calls a holiday by its name on the day, the label saying it is a public holiday', () => {
    renderWithProviders(
      <AttendanceDayCell day={day({ status: 'HOLIDAY', holiday: 'Ganesh Chaturthi' })} />,
    );
    const cell = screen.getByLabelText('7 September, Public holiday, Ganesh Chaturthi');
    expect(cell).toHaveTextContent(/^7Ganesh Chaturthi$/);
    expect(screen.queryByText('Public holiday')).toBeNull();
  });

  it('writes the leave code under the leave status', () => {
    renderWithProviders(
      <AttendanceDayCell day={day({ status: 'LEAVE_APPROVED', leaveType: 'CL' })} />,
    );
    const cell = screen.getByLabelText('7 September, Leave approved, CL');
    expect(cell).toHaveTextContent(/^7Leave approvedCL$/);
  });

  it('marks a week off in words', () => {
    renderWithProviders(<AttendanceDayCell day={day({ status: 'WEEK_OFF' })} />);
    expect(screen.getByLabelText('7 September, Week off')).toHaveTextContent(/^7Week off$/);
  });

  it('adds the holiday name under another status, such as attendance marked on a holiday', () => {
    renderWithProviders(
      <AttendanceDayCell
        day={day({ status: 'PRESENT', holiday: 'Ganesh Chaturthi', inMonth: false })}
      />,
    );
    const cell = screen.getByLabelText('7 September, Attendance marked, Ganesh Chaturthi');
    expect(cell).toHaveTextContent(/^7Attendance markedGanesh Chaturthi$/);
  });

  it('prefers the leave code to the holiday name in the note when a day carries both', () => {
    renderWithProviders(
      <AttendanceDayCell
        day={day({ status: 'LEAVE_APPROVED', leaveType: 'EL', holiday: 'Ganesh Chaturthi' })}
      />,
    );
    const cell = screen.getByLabelText('7 September, Leave approved, EL, Ganesh Chaturthi');
    expect(cell).toHaveTextContent(/^7Leave approvedEL$/);
  });
});
