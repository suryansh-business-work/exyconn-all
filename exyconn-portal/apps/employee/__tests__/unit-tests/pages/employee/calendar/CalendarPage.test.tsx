import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMyHolidaysQuery, useMyLeaveRequestsQuery } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../../test-utils';
import { queryResult, type QueryShape } from '../helpers/apollo';
import { CalendarPage } from '../../../../../src/pages/employee/calendar';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useMyHolidaysQuery: vi.fn(),
  useMyLeaveRequestsQuery: vi.fn(),
}));

// Local-time strings keep the grid comparisons timezone-stable.
const holidays = [{ id: 'h1', name: 'Republic Day', date: '2026-01-26T00:00:00' }];
const leaves = [
  { id: 'l1', fromDate: '2026-01-12T00:00:00', toDate: '2026-01-13T00:00:00', status: 'APPROVED' },
];

const DEFAULT_HOLIDAY_QUERY: QueryShape = { data: { myHolidays: holidays } };
const DEFAULT_LEAVE_QUERY: QueryShape = { data: { myLeaveRequests: leaves } };

function renderCalendar(
  holidayQuery: QueryShape = DEFAULT_HOLIDAY_QUERY,
  leaveQuery: QueryShape = DEFAULT_LEAVE_QUERY,
) {
  vi.mocked(useMyHolidaysQuery).mockReturnValue(queryResult(holidayQuery));
  vi.mocked(useMyLeaveRequestsQuery).mockReturnValue(queryResult(leaveQuery));
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

  it('marks the holiday by name and each day of leave', () => {
    renderCalendar();
    expect(screen.getByText('Republic Day')).toBeInTheDocument();
    expect(screen.getByLabelText('Republic Day')).toBeInTheDocument();
    expect(screen.getAllByLabelText('On leave')).toHaveLength(2);
    // Two leave chips in the grid, one in the key below it.
    expect(screen.getAllByText('Leave')).toHaveLength(3);
    expect(screen.getByText('Your leave')).toBeInTheDocument();
    expect(screen.getByText('Holiday')).toBeInTheDocument();
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
    expect(screen.getAllByLabelText('On leave')).toHaveLength(2);
  });

  it('shows a spinner while leave is loading', () => {
    renderCalendar(undefined, { loading: true });
    expect(screen.getByRole('progressbar', { name: 'Loading calendar' })).toBeInTheDocument();
    expect(screen.queryAllByLabelText('On leave')).toHaveLength(0);
  });
});
