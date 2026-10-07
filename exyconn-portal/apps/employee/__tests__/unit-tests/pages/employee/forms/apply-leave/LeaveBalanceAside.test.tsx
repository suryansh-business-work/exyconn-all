import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import {
  useMyLeaveBalancesQuery,
  type MyLeaveBalancesQuery,
} from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../../../test-utils';
import { queryResult } from '../../apolloHookMocks';
import { LeaveBalanceAside } from '../../../../../../src/pages/employee/forms/apply-leave/LeaveBalanceAside';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useMyLeaveBalancesQuery: vi.fn(),
}));

type Balance = MyLeaveBalancesQuery['myLeaveBalances'][number];

const YEAR = new Date().getFullYear();
const NAMES: Record<string, string> = { CL: 'Casual Leave', SL: 'Sick Leave' };
const nameOf = (code: string) => NAMES[code] ?? code;

function balance(patch: Partial<Balance>): Balance {
  return {
    id: 'b-cl',
    employeeId: 'emp-1',
    leaveTypeCode: 'CL',
    year: YEAR,
    allocated: 12,
    carriedForward: 0,
    used: 2,
    adjustment: 0,
    available: 10,
    ...patch,
  };
}

function answer(result: Parameters<typeof queryResult>[0]) {
  vi.mocked(useMyLeaveBalancesQuery).mockReturnValue(
    queryResult<typeof useMyLeaveBalancesQuery>(result),
  );
}

const BALANCES = [
  balance({}),
  balance({ id: 'b-sl', leaveTypeCode: 'SL', used: 1, available: 5 }),
  balance({ id: 'b-old', leaveTypeCode: 'XX', year: YEAR - 1, available: 99 }),
];

beforeEach(() => {
  vi.mocked(useMyLeaveBalancesQuery).mockReset();
});

describe('LeaveBalanceAside', () => {
  it('asks the server for fresh balances and lists this year’s by HR’s names', () => {
    answer({ data: { myLeaveBalances: BALANCES } });
    renderWithProviders(<LeaveBalanceAside type="" days={0} nameOf={nameOf} />);

    expect(useMyLeaveBalancesQuery).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
    expect(screen.getByRole('complementary', { name: 'Your leave balance' })).toBeInTheDocument();
    expect(screen.getByText(`Your leave balance ${YEAR}`)).toBeInTheDocument();
    expect(screen.getByText('Casual Leave')).toBeInTheDocument();
    expect(screen.getByText('10 of 12 days')).toBeInTheDocument();
    expect(screen.getByText('Sick Leave')).toBeInTheDocument();
    expect(screen.getByText('5 of 6 days')).toBeInTheDocument();
    // Last year's balance is not this year's to spend.
    expect(screen.queryByText('XX')).not.toBeInTheDocument();
  });

  it('holds skeleton rows while the first load is in flight', () => {
    answer({ loading: true });
    const { container } = renderWithProviders(
      <LeaveBalanceAside type="" days={0} nameOf={nameOf} />,
    );

    expect(container.querySelectorAll('.MuiSkeleton-root')).toHaveLength(3);
    expect(screen.queryByText('HR has not given you any leave balance yet.')).toBeNull();
  });

  it('keeps showing cached balances instead of skeletons during a refetch', () => {
    answer({ loading: true, data: { myLeaveBalances: BALANCES } });
    const { container } = renderWithProviders(
      <LeaveBalanceAside type="" days={0} nameOf={nameOf} />,
    );

    expect(container.querySelectorAll('.MuiSkeleton-root')).toHaveLength(0);
    expect(screen.getByText('Casual Leave')).toBeInTheDocument();
  });

  it('shows the error when the balances cannot be read', () => {
    answer({ error: new Error('Balances are unavailable') });
    renderWithProviders(<LeaveBalanceAside type="" days={0} nameOf={nameOf} />);

    expect(screen.getByText('Balances are unavailable')).toBeInTheDocument();
    expect(screen.queryByText('HR has not given you any leave balance yet.')).toBeNull();
  });

  it('says so when HR has given no balance this year', () => {
    answer({ data: { myLeaveBalances: [balance({ year: YEAR - 1 })] } });
    renderWithProviders(<LeaveBalanceAside type="" days={0} nameOf={nameOf} />);

    expect(screen.getByText('HR has not given you any leave balance yet.')).toBeInTheDocument();
  });

  it.each([
    ['no type is picked', '', 3],
    ['no dates are set', 'CL', 0],
  ])('prompts for the request when %s', (_case, type, days) => {
    answer({ data: { myLeaveBalances: BALANCES } });
    renderWithProviders(<LeaveBalanceAside type={type} days={days} nameOf={nameOf} />);

    expect(
      screen.getByText('Pick a leave type and dates to see what this request uses.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('tells the employee unpaid leave uses no balance', () => {
    answer({ data: { myLeaveBalances: BALANCES } });
    renderWithProviders(<LeaveBalanceAside type="UNPAID" days={4} nameOf={nameOf} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Unpaid leave does not use a balance.');
  });

  it('warns when the picked type has no balance yet', () => {
    answer({ data: { myLeaveBalances: BALANCES } });
    renderWithProviders(<LeaveBalanceAside type="ML" days={2} nameOf={nameOf} />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'You have no balance for this leave type yet. HR can add one.',
    );
  });

  it('shows what is left after a request that fits, down to exactly zero', () => {
    answer({ data: { myLeaveBalances: BALANCES } });
    const { rerender } = renderWithProviders(
      <LeaveBalanceAside type="CL" days={3} nameOf={nameOf} />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'This request uses 3 days; 7 will be left.',
    );

    rerender(<LeaveBalanceAside type="CL" days={10} nameOf={nameOf} />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'This request uses 10 days; 0 will be left.',
    );
  });

  it('flags a request longer than the balance', () => {
    answer({ data: { myLeaveBalances: BALANCES } });
    renderWithProviders(<LeaveBalanceAside type="SL" days={6} nameOf={nameOf} />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'This request is 6 days but only 5 are left. HR cannot approve more than you have.',
    );
  });
});
