import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMyLeaveBalancesQuery, useMyLeaveRequestsQuery } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { queryResult } from './helpers/apollo';
import { MyLeavePage } from '../../../../src/pages/employee/MyLeavePage';

const logger = vi.hoisted(() => ({ warn: vi.fn() }));

vi.mock('@exyconn/shell/logging/portalLogger', () => ({ portalLogger: logger }));
vi.mock('@exyconn/shell/hooks/useSettings', () => import('./helpers/settings'));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useMyLeaveRequestsQuery: vi.fn(),
  useMyLeaveBalancesQuery: vi.fn(),
}));
vi.mock('../../../../src/pages/employee/forms/apply-leave', async () => {
  const { FormStub } = await import('./helpers/stubs');
  return { ApplyLeaveForm: FormStub };
});

const requests = [
  {
    id: 'l1',
    type: 'CASUAL',
    fromDate: '2026-03-09',
    toDate: '2026-03-10',
    reason: 'Family function',
    status: 'APPROVED',
  },
];

const balances = [
  {
    id: 'b1',
    employeeId: 'e1',
    leaveTypeCode: 'CL',
    year: new Date().getFullYear(),
    allocated: 8,
    carriedForward: 0,
    used: 2,
    adjustment: 0,
    available: 6,
  },
];

function renderPage({
  refetch = vi.fn(() => Promise.resolve({})),
  refetchBalances = vi.fn(() => Promise.resolve({})),
}: Readonly<{ refetch?: () => Promise<unknown>; refetchBalances?: () => Promise<unknown> }> = {}) {
  vi.mocked(useMyLeaveRequestsQuery).mockReturnValue(
    queryResult({ data: { myLeaveRequests: requests }, refetch }),
  );
  vi.mocked(useMyLeaveBalancesQuery).mockReturnValue(
    queryResult({ data: { myLeaveBalances: balances }, refetch: refetchBalances }),
  );
  renderWithProviders(<MyLeavePage />);
  return { refetch, refetchBalances };
}

beforeEach(() => {
  logger.warn.mockClear();
});

describe('MyLeavePage', () => {
  it('shows the balance tiles and each request with its dates, reason and status', () => {
    renderPage();
    expect(screen.getByText('CL left')).toBeInTheDocument();
    expect(screen.getByText('6 of 8 days')).toBeInTheDocument();

    const [, row] = screen.getAllByRole('row');
    expect(within(row).getByText('CASUAL')).toBeInTheDocument();
    expect(within(row).getByText('on 2026-03-09')).toBeInTheDocument();
    expect(within(row).getByText('on 2026-03-10')).toBeInTheDocument();
    expect(within(row).getByText('Family function')).toBeInTheDocument();
    expect(within(row).getByText('APPROVED')).toBeInTheDocument();
  });

  it('holds placeholder tiles while balances load, and says when there are no requests', () => {
    vi.mocked(useMyLeaveRequestsQuery).mockReturnValue(
      queryResult({ data: { myLeaveRequests: [] } }),
    );
    vi.mocked(useMyLeaveBalancesQuery).mockReturnValue(queryResult({ loading: true }));
    const { container } = renderWithProviders(<MyLeavePage />);

    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.getByText('You have no leave requests yet.')).toBeInTheDocument();
  });

  it('opens the leave form and closes it by the back link or Cancel', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Apply for leave' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Apply for leave' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back to My Leave' }));
    expect(screen.getByRole('heading', { level: 1, name: 'My Leave' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Apply for leave' }));
    await user.click(screen.getByRole('button', { name: 'Stub cancel' }));
    expect(screen.getByRole('heading', { level: 1, name: 'My Leave' })).toBeInTheDocument();
  });

  it('reloads both the requests and the balances once leave is applied for', async () => {
    const user = userEvent.setup();
    const { refetch, refetchBalances } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Apply for leave' }));
    await user.click(screen.getByRole('button', { name: 'Stub done' }));

    expect(screen.getByRole('heading', { level: 1, name: 'My Leave' })).toBeInTheDocument();
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(refetchBalances).toHaveBeenCalledTimes(1);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('logs a failed reload instead of failing the page', async () => {
    const user = userEvent.setup();
    const failure = new Error('offline');
    renderPage({ refetchBalances: vi.fn(() => Promise.reject(failure)) });

    await user.click(screen.getByRole('button', { name: 'Apply for leave' }));
    await user.click(screen.getByRole('button', { name: 'Stub done' }));

    await waitFor(() =>
      expect(logger.warn).toHaveBeenCalledWith('Could not reload leave after applying', failure),
    );
  });

  it('holds the requests table busy and does not say there are none while they load', () => {
    vi.mocked(useMyLeaveRequestsQuery).mockReturnValue(queryResult({ loading: true }));
    vi.mocked(useMyLeaveBalancesQuery).mockReturnValue(
      queryResult({ data: { myLeaveBalances: balances } }),
    );
    const { container } = renderWithProviders(<MyLeavePage />);

    expect(screen.queryByText('You have no leave requests yet.')).toBeNull();
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
  });
});
