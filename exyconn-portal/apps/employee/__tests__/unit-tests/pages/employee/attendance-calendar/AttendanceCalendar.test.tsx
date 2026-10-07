import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMyHolidaysQuery, useMyLeaveRequestsQuery } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../../test-utils';
import { queryResult, type QueryShape } from '../helpers/apollo';
import { AttendanceCalendar } from '../../../../../src/pages/employee/attendance-calendar';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useMyLeaveRequestsQuery: vi.fn(),
  useMyHolidaysQuery: vi.fn(),
}));

/** A September 2026 day as the date picker stores it: local midnight, in ISO. */
const local = (day: number) => new Date(2026, 8, day).toISOString();

const attendance = [
  // Attendance is stored at midnight UTC of the employee's own day.
  { date: '2026-09-01T00:00:00.000Z', status: 'PRESENT' },
  { date: '2026-09-03T00:00:00.000Z', status: 'ABSENT' },
  { date: '2026-09-15T00:00:00.000Z', status: 'WFH' },
];

const leaves = [
  { id: 'l1', fromDate: local(8), toDate: local(8), status: 'PENDING' },
  { id: 'l2', fromDate: local(10), toDate: local(10), status: 'REJECTED' },
  { id: 'l3', fromDate: local(22), toDate: local(23), status: 'APPROVED' },
];

const holidays = [
  { id: 'h1', date: local(12), name: 'Founders Day' },
  { id: 'h2', date: local(15), name: 'Onam' },
];

function renderCalendar({
  attendanceLoading = false,
  leaveQuery = { data: { myLeaveRequests: leaves } },
  holidayQuery = { data: { myHolidays: holidays } },
}: Readonly<{
  attendanceLoading?: boolean;
  leaveQuery?: QueryShape;
  holidayQuery?: QueryShape;
}> = {}) {
  vi.mocked(useMyLeaveRequestsQuery).mockReturnValue(queryResult(leaveQuery));
  vi.mocked(useMyHolidaysQuery).mockReturnValue(queryResult(holidayQuery));
  renderWithProviders(
    <AttendanceCalendar attendance={attendance} attendanceLoading={attendanceLoading} />,
  );
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 19, 10, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AttendanceCalendar', () => {
  it('names every day by what happened on it', () => {
    renderCalendar();

    expect(screen.getByRole('heading', { name: 'September 2026' })).toBeInTheDocument();
    expect(screen.getByLabelText('1 September, Attendance marked')).toBeInTheDocument();
    expect(screen.getByLabelText('3 September, Absent')).toBeInTheDocument();
    expect(screen.getByLabelText('8 September, Leave requested')).toBeInTheDocument();
    expect(screen.getByLabelText('10 September, Leave rejected')).toBeInTheDocument();
    expect(screen.getByLabelText('22 September, Leave approved')).toBeInTheDocument();
    expect(screen.getByLabelText('23 September, Leave approved')).toBeInTheDocument();
    expect(screen.getByLabelText('20 September')).toBeInTheDocument();
    // The grid runs in whole weeks, so it opens on the last days of August.
    expect(screen.getByLabelText('30 August')).toBeInTheDocument();
  });

  it('names a holiday, and keeps its name on a day attendance was marked', () => {
    renderCalendar();

    const holiday = screen.getByLabelText('12 September, Public holiday, Founders Day');
    expect(within(holiday).getByText('Public holiday')).toBeInTheDocument();
    expect(within(holiday).queryByText('Founders Day')).toBeNull();

    const worked = screen.getByLabelText('15 September, Attendance marked, Onam');
    expect(within(worked).getByText('Attendance marked')).toBeInTheDocument();
    expect(within(worked).getByText('Onam')).toBeInTheDocument();
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

  it('shows a spinner while any of its data is loading', () => {
    renderCalendar({ attendanceLoading: true });
    expect(screen.getByRole('progressbar', { name: 'Loading calendar' })).toBeInTheDocument();
  });

  it('shows a spinner while leave is loading, the days plain until it arrives', () => {
    renderCalendar({ leaveQuery: { loading: true } });
    expect(screen.getByRole('progressbar', { name: 'Loading calendar' })).toBeInTheDocument();
    expect(screen.getByLabelText('8 September')).toBeInTheDocument();
  });

  it('shows a spinner while holidays are loading', () => {
    renderCalendar({ holidayQuery: { loading: true } });
    expect(screen.getByRole('progressbar', { name: 'Loading calendar' })).toBeInTheDocument();
    expect(screen.getByLabelText('12 September')).toBeInTheDocument();
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
});
