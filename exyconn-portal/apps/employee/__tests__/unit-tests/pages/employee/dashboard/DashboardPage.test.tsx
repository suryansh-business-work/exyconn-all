import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { formatMoney } from '@exyconn/shell/utils/money';
import * as generated from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../../test-utils';
import { queryResult, type QueryShape } from '../helpers/apollo';
import * as fixtures from './dashboard.fixtures';
import { DashboardPage } from '../../../../../src/pages/employee/dashboard';

const auth = vi.hoisted(() => ({ user: null as null | { name: string } }));

vi.mock('@exyconn/shell/auth/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('@exyconn/shell/hooks/useSettings', () => import('../helpers/settings'));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useMyAttendanceQuery: vi.fn(),
  useMyLeaveRequestsQuery: vi.fn(),
  useMyHolidaysQuery: vi.fn(),
  useMySalarySlipsQuery: vi.fn(),
  useMyPayrollQuery: vi.fn(),
  useMySupportTicketsQuery: vi.fn(),
  useActiveAnnouncementsQuery: vi.fn(),
  useMyLeaveBalancesQuery: vi.fn(),
}));

/** Every query the dashboard reads, answered with `answer(data)`. */
function answerAll(answer: (data: Record<string, unknown>) => QueryShape) {
  vi.mocked(generated.useMyAttendanceQuery).mockReturnValue(
    queryResult(answer({ myAttendance: fixtures.attendance })),
  );
  vi.mocked(generated.useMyLeaveRequestsQuery).mockReturnValue(
    queryResult(answer({ myLeaveRequests: fixtures.leaveRequests })),
  );
  vi.mocked(generated.useMyHolidaysQuery).mockReturnValue(
    queryResult(answer({ myHolidays: fixtures.holidays })),
  );
  vi.mocked(generated.useMySalarySlipsQuery).mockReturnValue(
    queryResult(answer({ mySalarySlips: fixtures.salarySlips })),
  );
  vi.mocked(generated.useMyPayrollQuery).mockReturnValue(
    queryResult(answer({ myPayroll: fixtures.payroll })),
  );
  vi.mocked(generated.useMySupportTicketsQuery).mockReturnValue(
    queryResult(answer({ mySupportTickets: fixtures.tickets })),
  );
  vi.mocked(generated.useActiveAnnouncementsQuery).mockReturnValue(
    queryResult(answer({ activeAnnouncements: fixtures.announcements })),
  );
  vi.mocked(generated.useMyLeaveBalancesQuery).mockReturnValue(
    queryResult(answer({ myLeaveBalances: fixtures.balances })),
  );
}

/** Empty lists and no payroll: a brand-new joiner's workspace. */
const EMPTY: Record<string, unknown> = {
  myAttendance: [],
  myLeaveRequests: [],
  myHolidays: [],
  mySalarySlips: [],
  myPayroll: null,
  mySupportTickets: [],
  activeAnnouncements: [],
  myLeaveBalances: [],
};

/** The figure on the stat tile with this label. */
const tile = (label: string) => screen.getByText(label).parentElement?.nextElementSibling;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 2, 15, 10, 0));
  auth.user = { name: 'Asha Rao' };
});

afterEach(() => {
  vi.useRealTimers();
});

describe('DashboardPage', () => {
  it('greets the employee by first name and sums up their day, month and year', () => {
    // A reload in flight over data already on screen keeps the figures, not skeletons.
    answerAll((data) => ({ data, loading: true }));
    renderWithProviders(<DashboardPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Hello, Asha' })).toBeInTheDocument();
    expect(tile('Today')).toHaveTextContent('HALF DAY');
    expect(tile('Present this month')).toHaveTextContent('2');
    expect(tile('Work from home')).toHaveTextContent('1');
    expect(tile('Leave balance')).toHaveTextContent('4 d');
    expect(tile('Leave pending')).toHaveTextContent('1');
    expect(tile('Leave available')).toHaveTextContent('3 d');
    expect(tile('Leave taken 2026')).toHaveTextContent('2 d');
    expect(tile('Latest slip')).toHaveTextContent('Feb 2026');
    expect(tile('Monthly net')).toHaveTextContent(
      formatMoney(75000, 'INR').replaceAll(/\s+/g, ' '),
    );
    expect(tile('Open tickets')).toHaveTextContent('2');
  });

  it('shows the four newest announcements, the next holidays and the latest leave', () => {
    answerAll((data) => ({ data }));
    renderWithProviders(<DashboardPage />);

    expect(screen.getByText('Notice Four')).toBeInTheDocument();
    expect(screen.queryByText('Notice Five')).toBeNull();
    expect(screen.getByText('Good Friday')).toBeInTheDocument();
    expect(screen.queryByText('Holi')).toBeNull();
    expect(
      screen.getByText('CL · on 2026-03-02T00:00:00 → on 2026-03-03T00:00:00'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/on 2025-11-03T00:00:00/)).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('says what is not there yet for a new joiner, rather than showing zeros', () => {
    auth.user = null;
    answerAll(() => ({ data: EMPTY }));
    renderWithProviders(<DashboardPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Hello, there' })).toBeInTheDocument();
    expect(tile('Today')).toHaveTextContent('Not marked');
    expect(tile('Leave balance')).toHaveTextContent('Not set');
    expect(tile('Leave available')).toHaveTextContent('0 d');
    expect(tile('Latest slip')).toHaveTextContent('—');
    expect(tile('Monthly net')).toHaveTextContent('—');
    expect(tile('Open tickets')).toHaveTextContent('0');
    expect(screen.getByText('Nothing announced right now.')).toBeInTheDocument();
    expect(screen.getByText('No holidays scheduled ahead.')).toBeInTheDocument();
    expect(screen.getByText('No leave requests yet.')).toBeInTheDocument();
  });

  it('holds placeholders everywhere until the first answers arrive', () => {
    answerAll(() => ({ loading: true }));
    renderWithProviders(<DashboardPage />);

    expect(tile('Today')).toHaveTextContent(/^$/);
    expect(tile('Today')?.querySelector('.MuiSkeleton-root')).not.toBeNull();
    expect(screen.getAllByRole('status')).toHaveLength(3);
    expect(screen.queryByText('Nothing announced right now.')).toBeNull();
  });
});
