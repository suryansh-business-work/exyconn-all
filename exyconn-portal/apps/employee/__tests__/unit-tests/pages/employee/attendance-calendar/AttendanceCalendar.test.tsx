import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  useMyHolidaysQuery,
  useMyLeaveRequestsQuery,
  useMyWorkProfileQuery,
} from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../../test-utils';
import { queryResult, type QueryShape } from '../helpers/apollo';
import { AttendanceCalendar } from '../../../../../src/pages/employee/attendance-calendar';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useMyLeaveRequestsQuery: vi.fn(),
  useMyHolidaysQuery: vi.fn(),
  useMyWorkProfileQuery: vi.fn(),
}));

/** A September 2026 day as the date picker stores it: local midnight, in ISO. */
const local = (day: number) => new Date(2026, 8, day).toISOString();

// September 2026 opens on a Tuesday: the 12th, 19th, 20th, 26th and 27th are weekend days.
const attendance = [
  // Attendance is stored at midnight UTC of the employee's own day.
  { date: '2026-09-01T00:00:00.000Z', status: 'PRESENT' },
  { date: '2026-09-03T00:00:00.000Z', status: 'ABSENT' },
  { date: '2026-09-15T00:00:00.000Z', status: 'WFH' },
];

const leaves = [
  { id: 'l1', type: 'CL', fromDate: local(8), toDate: local(8), status: 'PENDING' },
  { id: 'l2', type: 'EL', fromDate: local(10), toDate: local(10), status: 'REJECTED' },
  { id: 'l3', type: 'EL', fromDate: local(22), toDate: local(23), status: 'APPROVED' },
  // Runs over a weekend: the week off wins Saturday and Sunday, Monday is leave.
  { id: 'l4', type: 'SL', fromDate: local(26), toDate: local(28), status: 'APPROVED' },
];

const holidays = [
  // A Saturday: the holiday outranks the week off.
  { id: 'h1', date: local(12), name: 'Founders Day' },
  { id: 'h2', date: local(15), name: 'Onam' },
];

const MONDAY_TO_FRIDAY = [1, 2, 3, 4, 5];

function renderCalendar({
  attendanceLoading = false,
  leaveQuery = { data: { myLeaveRequests: leaves } },
  holidayQuery = { data: { myHolidays: holidays } },
  profileQuery = { data: { me: { id: 'u1', effectiveWorkDays: MONDAY_TO_FRIDAY } } },
}: Readonly<{
  attendanceLoading?: boolean;
  leaveQuery?: QueryShape;
  holidayQuery?: QueryShape;
  profileQuery?: QueryShape;
}> = {}) {
  vi.mocked(useMyLeaveRequestsQuery).mockReturnValue(queryResult(leaveQuery));
  vi.mocked(useMyHolidaysQuery).mockReturnValue(queryResult(holidayQuery));
  vi.mocked(useMyWorkProfileQuery).mockReturnValue(queryResult(profileQuery));
  renderWithProviders(
    <AttendanceCalendar attendance={attendance} attendanceLoading={attendanceLoading} />,
  );
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 17, 10, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AttendanceCalendar', () => {
  it('names every day by what happened on it, with the leave code', () => {
    renderCalendar();

    expect(screen.getByRole('heading', { name: 'September 2026' })).toBeInTheDocument();
    expect(screen.getByLabelText('1 September, Attendance marked')).toBeInTheDocument();
    expect(screen.getByLabelText('3 September, Absent')).toBeInTheDocument();
    expect(screen.getByLabelText('8 September, Leave requested, CL')).toBeInTheDocument();
    expect(screen.getByLabelText('10 September, Leave rejected, EL')).toBeInTheDocument();
    expect(screen.getByLabelText('22 September, Leave approved, EL')).toBeInTheDocument();
    expect(screen.getByLabelText('23 September, Leave approved, EL')).toBeInTheDocument();
    expect(screen.getByLabelText('17 September')).toBeInTheDocument();
    // The grid runs in whole weeks, so it opens on the last days of August.
    expect(screen.getByLabelText('30 August, Week off')).toBeInTheDocument();
  });

  it('writes the leave code under the status on the day', () => {
    renderCalendar();
    const leave = screen.getByLabelText('8 September, Leave requested, CL');
    expect(within(leave).getByText('Leave requested')).toBeInTheDocument();
    expect(within(leave).getByText('CL')).toBeInTheDocument();
  });

  it('calls a holiday by its name, and keeps the name on a day attendance was marked', () => {
    renderCalendar();

    const holiday = screen.getByLabelText('12 September, Public holiday, Founders Day');
    expect(holiday).toHaveTextContent(/^12Founders Day$/);

    const worked = screen.getByLabelText('15 September, Attendance marked, Onam');
    expect(within(worked).getByText('Attendance marked')).toBeInTheDocument();
    expect(within(worked).getByText('Onam')).toBeInTheDocument();
  });

  it('marks the days outside the working week, ahead of leave over them', () => {
    renderCalendar();

    expect(screen.getByLabelText('20 September, Week off')).toHaveTextContent(/^20Week off$/);
    expect(screen.getByLabelText('26 September, Week off')).toBeInTheDocument();
    expect(screen.getByLabelText('27 September, Week off')).toBeInTheDocument();
    expect(screen.getByLabelText('28 September, Leave approved, SL')).toBeInTheDocument();
  });

  it('marks no week off until the working week is known', () => {
    renderCalendar({ profileQuery: { loading: true } });

    expect(screen.getByRole('progressbar', { name: 'Loading calendar' })).toBeInTheDocument();
    expect(screen.getByLabelText('20 September')).toBeInTheDocument();
    expect(screen.getByLabelText('26 September, Leave approved, SL')).toBeInTheDocument();
    expect(screen.queryAllByLabelText(/Week off/)).toHaveLength(0);
  });

  it('follows a working week of its own, such as Sunday to Thursday', () => {
    renderCalendar({
      profileQuery: { data: { me: { id: 'u1', effectiveWorkDays: [0, 1, 2, 3, 4] } } },
    });

    expect(screen.getByLabelText('20 September')).toBeInTheDocument();
    expect(screen.getByLabelText('18 September, Week off')).toBeInTheDocument();
    expect(screen.getByLabelText('19 September, Week off')).toBeInTheDocument();
  });

  it('labels the weekdays and explains every colour beside the grid', () => {
    renderCalendar();
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Calendar colours' })).toBeInTheDocument();
  });

  it('moves a month at a time', async () => {
    const user = userEvent.setup();
    renderCalendar();

    await user.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByRole('heading', { name: 'October 2026' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByRole('heading', { name: 'August 2026' })).toBeInTheDocument();
  });

  it('shows no spinner once everything has loaded', () => {
    renderCalendar();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('shows a spinner while any of its data is loading', () => {
    renderCalendar({ attendanceLoading: true });
    expect(screen.getByRole('progressbar', { name: 'Loading calendar' })).toBeInTheDocument();
  });

  it('shows a spinner while leave is loading, the days plain until it arrives', () => {
    renderCalendar({ leaveQuery: { loading: true } });
    expect(screen.getByRole('progressbar', { name: 'Loading calendar' })).toBeInTheDocument();
    expect(screen.getByLabelText('8 September')).toBeInTheDocument();
  });

  it('shows a spinner while holidays are loading, the weekend holiday a week off meanwhile', () => {
    renderCalendar({ holidayQuery: { loading: true } });
    expect(screen.getByRole('progressbar', { name: 'Loading calendar' })).toBeInTheDocument();
    expect(screen.getByLabelText('12 September, Week off')).toBeInTheDocument();
  });

  it('says why leave could not be loaded', () => {
    renderCalendar({ leaveQuery: { error: new Error('Leave service down') } });
    expect(screen.getByText('Leave service down')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('says why holidays could not be loaded', () => {
    renderCalendar({ holidayQuery: { error: new Error('Holiday service down') } });
    expect(screen.getByText('Holiday service down')).toBeInTheDocument();
  });

  it('says why the working week could not be loaded, and marks no week off', () => {
    renderCalendar({ profileQuery: { error: new Error('Profile service down') } });
    expect(screen.getByText('Profile service down')).toBeInTheDocument();
    expect(screen.getByLabelText('20 September')).toBeInTheDocument();
  });
});
