import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  LeaveStatus,
  useSetLeaveStatusMutation,
  useTeamLeaveRequestsQuery,
} from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../../test-utils';
import { mutationTuple, queryResult } from '../apolloHookMocks';
import { TeamLeaveSection } from '../../../../../src/pages/employee/team/TeamLeaveSection';
import { leaveRow, nameOf } from './teamFixtures';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useTeamLeaveRequestsQuery: vi.fn(),
  useSetLeaveStatusMutation: vi.fn(),
}));

const setStatus = vi.fn();

function setup(result: Parameters<typeof queryResult>[0]) {
  const refetch = vi.fn().mockResolvedValue(undefined);
  vi.mocked(useTeamLeaveRequestsQuery).mockReturnValue(
    queryResult<typeof useTeamLeaveRequestsQuery>({ refetch, ...result }),
  );
  renderWithProviders(<TeamLeaveSection nameOf={nameOf} />);
  return { refetch };
}

const ROWS = [
  leaveRow(),
  leaveRow({ id: 'leave-2', employeeId: 'emp-gone', status: LeaveStatus.Approved }),
];

beforeEach(() => {
  setStatus.mockReset();
  vi.mocked(useSetLeaveStatusMutation).mockReturnValue(
    mutationTuple<typeof useSetLeaveStatusMutation>(setStatus),
  );
});

describe('TeamLeaveSection', () => {
  it('lists the team’s leave by name, dates and status', () => {
    setup({ data: { teamLeaveRequests: ROWS } });

    expect(useTeamLeaveRequestsQuery).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
    expect(screen.getByText('Leave requests')).toBeInTheDocument();
    const [, pendingRow, decidedRow] = screen.getAllByRole('row');
    expect(within(pendingRow).getByText('Asha Rao')).toBeInTheDocument();
    expect(within(pendingRow).getByText('CL')).toBeInTheDocument();
    expect(within(pendingRow).getByText('04 Mar 2026')).toBeInTheDocument();
    expect(within(pendingRow).getByText('06 Mar 2026')).toBeInTheDocument();
    expect(within(pendingRow).getByText('Family function')).toBeInTheDocument();
    expect(within(pendingRow).getByText('PENDING')).toBeInTheDocument();
    // Someone no longer reporting here still shows, by id.
    expect(within(decidedRow).getByText('emp-gone')).toBeInTheDocument();
  });

  it('offers a decision only on pending leave', () => {
    setup({ data: { teamLeaveRequests: ROWS } });
    const [, pendingRow, decidedRow] = screen.getAllByRole('row');

    expect(within(pendingRow).getByRole('button', { name: 'approve' })).toBeInTheDocument();
    expect(within(pendingRow).getByRole('button', { name: 'reject' })).toBeInTheDocument();
    expect(within(decidedRow).queryByRole('button', { name: 'approve' })).toBeNull();
    expect(within(decidedRow).queryByRole('button', { name: 'reject' })).toBeNull();
  });

  it('approves after confirmation and refreshes the list', async () => {
    setStatus.mockResolvedValue({ data: { setLeaveStatus: { id: 'leave-1' } } });
    const { refetch } = setup({ data: { teamLeaveRequests: ROWS } });

    await userEvent.click(screen.getByRole('button', { name: 'approve' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Approve this leave request?');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Approve' }));

    await waitFor(() =>
      expect(setStatus).toHaveBeenCalledWith({
        variables: { id: 'leave-1', status: LeaveStatus.Approved },
      }),
    );
    await waitFor(() => expect(refetch).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Leave approved')).toBeInTheDocument();
  });

  it('rejects after confirmation', async () => {
    setStatus.mockResolvedValue({ data: { setLeaveStatus: { id: 'leave-1' } } });
    setup({ data: { teamLeaveRequests: ROWS } });

    await userEvent.click(screen.getByRole('button', { name: 'reject' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reject' }));

    await waitFor(() =>
      expect(setStatus).toHaveBeenCalledWith({
        variables: { id: 'leave-1', status: LeaveStatus.Rejected },
      }),
    );
  });

  it('reloads the table from the refresh button', async () => {
    const { refetch } = setup({ data: { teamLeaveRequests: ROWS } });
    await userEvent.click(screen.getByRole('button', { name: 'Refresh table' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('says so when the team has asked for no leave', () => {
    setup({ data: { teamLeaveRequests: [] } });
    expect(screen.getByText('No leave requests from your team.')).toBeInTheDocument();
  });

  it('shows placeholder rows while loading', () => {
    setup({ loading: true });
    expect(screen.queryByText('No leave requests from your team.')).toBeNull();
    expect(screen.getByRole('table').closest('[aria-busy]')).toHaveAttribute('aria-busy', 'true');
  });
});
