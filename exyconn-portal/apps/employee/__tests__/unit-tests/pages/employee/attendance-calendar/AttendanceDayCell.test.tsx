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
    expect(cell).toHaveTextContent('7Leave requested');
  });

  it('names a holiday once, in the status, on a holiday', () => {
    renderWithProviders(
      <AttendanceDayCell day={day({ status: 'HOLIDAY', holiday: 'Ganesh Chaturthi' })} />,
    );
    const cell = screen.getByLabelText('7 September, Public holiday, Ganesh Chaturthi');
    expect(cell).toHaveTextContent('7Public holiday');
    expect(screen.queryByText('Ganesh Chaturthi')).toBeNull();
  });

  it('adds the holiday name under another status, such as leave on a holiday', () => {
    renderWithProviders(
      <AttendanceDayCell
        day={day({ status: 'LEAVE_APPROVED', holiday: 'Ganesh Chaturthi', inMonth: false })}
      />,
    );
    expect(
      screen.getByLabelText('7 September, Leave approved, Ganesh Chaturthi'),
    ).toBeInTheDocument();
    expect(screen.getByText('Ganesh Chaturthi')).toBeInTheDocument();
  });
});
