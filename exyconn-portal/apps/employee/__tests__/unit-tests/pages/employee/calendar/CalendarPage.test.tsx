import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  useMyHolidaysQuery,
  useMyLeaveRequestsQuery,
  useMyWorkProfileQuery,
} from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../../test-utils';
import { queryResult, type QueryShape } from '../helpers/apollo';
import { CalendarPage } from '../../../../../src/pages/employee/calendar';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useMyHolidaysQuery: vi.fn(),
  useMyLeaveRequestsQuery: vi.fn(),
  useMyWorkProfileQuery: vi.fn(),
}));

// January 2026 opens on a Thursday. Local-time strings keep the grid comparisons
// timezone-stable.
const holidays = [
  { id: 'h1', name: 'Republic Day', date: '2026-01-26T00:00:00' },
  // A Saturday: the holiday's name wins over the week off.
  { id: 'h2', name: 'Founders Day', date: '2026-01-03T00:00:00' },
];
const leaves = [
  {
    id: 'l1',
    type: 'CL',
    fromDate: '2026-01-12T00:00:00',
    toDate: '2026-01-13T00:00:00',
    status: 'APPROVED',
  },
];

const DEFAULT_HOLIDAY_QUERY: QueryShape = { data: { myHolidays: holidays } };
const DEFAULT_LEAVE_QUERY: QueryShape = { data: { myLeaveRequests: leaves } };
const DEFAULT_PROFILE_QUERY: QueryShape = {
  data: { me: { id: 'u1', effectiveWorkDays: [1, 2, 3, 4, 5] } },
};

function renderCalendar(
  holidayQuery: QueryShape = DEFAULT_HOLIDAY_QUERY,
  leaveQuery: QueryShape = DEFAULT_LEAVE_QUERY,
  profileQuery: QueryShape = DEFAULT_PROFILE_QUERY,
) {
  vi.mocked(useMyHolidaysQuery).mockReturnValue(queryResult(holidayQuery));
  vi.mocked(useMyLeaveRequestsQuery).mockReturnValue(queryResult(leaveQuery));
  vi.mocked(useMyWorkProfileQuery).mockReturnValue(queryResult(profileQuery));
  renderWithProviders(<CalendarPage />);
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 0, 15, 10, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('CalendarPage', () => {
  it('opens on the current month in whole weeks, with the weekday header', () => {
    renderCalendar();
    expect(screen.getByRole('heading', { level: 1, name: 'Calendar' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'January 2026' })).toBeInTheDocument();
    expect(screen.getByText('Sun')).toBeInTheDocument();
    // 28 December leads the grid and 28 January sits in it.
    expect(screen.getAllByText('28')).toHaveLength(2);
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('marks each holiday by name and each day of leave by its code', () => {
    renderCalendar();
    expect(screen.getByText('Republic Day')).toBeInTheDocument();
    expect(screen.getByLabelText('Republic Day')).toBeInTheDocument();
    expect(screen.getByLabelText('Founders Day')).toBeInTheDocument();
    expect(screen.getAllByLabelText('CL')).toHaveLength(2);
    expect(screen.getAllByText('CL')).toHaveLength(2);
    expect(screen.getByText('Your leave')).toBeInTheDocument();
    expect(screen.getByText('Holiday')).toBeInTheDocument();
  });

  it('marks every weekend day of a Monday-to-Friday week as a week off', () => {
    renderCalendar();
    // 28 Dec, and the 4th, 10th, 11th, 17th, 18th, 24th, 25th and 31st (the 3rd is a holiday).
    expect(screen.getAllByLabelText('Week off')).toHaveLength(9);
    // One word per week off in the grid, one in the key below it.
    expect(screen.getAllByText('Week off')).toHaveLength(10);
  });

  it('calls leave of no known type just Leave', () => {
    renderCalendar(DEFAULT_HOLIDAY_QUERY, {
      data: { myLeaveRequests: [{ ...leaves[0], type: undefined }] },
    });
    expect(screen.getAllByLabelText('Leave')).toHaveLength(2);
    // Two leave chips in the grid, one in the key below it.
    expect(screen.getAllByText('Leave')).toHaveLength(3);
  });

  it('puts the week off ahead of leave that runs over a weekend', () => {
    renderCalendar(DEFAULT_HOLIDAY_QUERY, {
      data: {
        myLeaveRequests: [
          { ...leaves[0], fromDate: '2026-01-16T00:00:00', toDate: '2026-01-19T00:00:00' },
        ],
      },
    });
    // Friday 16 and Monday 19 are leave; the weekend between stays a week off.
    expect(screen.getAllByLabelText('CL')).toHaveLength(2);
    expect(screen.getAllByLabelText('Week off')).toHaveLength(9);
  });

  it('marks no week off until the working week is known', () => {
    renderCalendar(DEFAULT_HOLIDAY_QUERY, DEFAULT_LEAVE_QUERY, { loading: true });
    expect(screen.getByRole('progressbar', { name: 'Loading calendar' })).toBeInTheDocument();
    expect(screen.queryAllByLabelText('Week off')).toHaveLength(0);
  });

  it('moves a month at a time', async () => {
    const user = userEvent.setup();
    renderCalendar();

    await user.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByRole('heading', { name: 'February 2026' })).toBeInTheDocument();
    expect(screen.queryByText('Republic Day')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByRole('heading', { name: 'December 2025' })).toBeInTheDocument();
  });

  it('shows a spinner while holidays are loading, the grid still drawn', () => {
    renderCalendar({ loading: true });
    expect(screen.getByRole('progressbar', { name: 'Loading calendar' })).toBeInTheDocument();
    expect(screen.queryByText('Republic Day')).toBeNull();
    expect(screen.getAllByLabelText('CL')).toHaveLength(2);
  });

  it('shows a spinner while leave is loading', () => {
    renderCalendar(undefined, { loading: true });
    expect(screen.getByRole('progressbar', { name: 'Loading calendar' })).toBeInTheDocument();
    expect(screen.queryAllByLabelText('CL')).toHaveLength(0);
  });
});
