import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  RequestStatus,
  useDecideEmployeeRequestMutation,
  useTeamRequestsQuery,
} from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../../test-utils';
import { mutationTuple, queryResult } from '../apolloHookMocks';
import { TeamRequestsSection } from '../../../../../src/pages/employee/team/TeamRequestsSection';
import { nameOf, requestRow } from './teamFixtures';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useTeamRequestsQuery: vi.fn(),
  useDecideEmployeeRequestMutation: vi.fn(),
}));

const decide = vi.fn();

function setup(result: Parameters<typeof queryResult>[0]) {
  const refetch = vi.fn().mockResolvedValue(undefined);
  vi.mocked(useTeamRequestsQuery).mockReturnValue(
    queryResult<typeof useTeamRequestsQuery>({ refetch, ...result }),
  );
  renderWithProviders(<TeamRequestsSection nameOf={nameOf} />);
  return { refetch };
}

const ROWS = [
  requestRow(),
  requestRow({ id: 'req-2', employeeId: 'emp-2', status: RequestStatus.Rejected }),
];

beforeEach(() => {
  decide.mockReset();
  vi.mocked(useDecideEmployeeRequestMutation).mockReturnValue(
    mutationTuple<typeof useDecideEmployeeRequestMutation>(decide),
  );
});

describe('TeamRequestsSection', () => {
  it('lists each request with who raised it, what and when', () => {
    setup({ data: { teamRequests: ROWS } });

    expect(useTeamRequestsQuery).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
    expect(screen.getByText('Requests')).toBeInTheDocument();
    const [, pendingRow, decidedRow] = screen.getAllByRole('row');
    expect(within(pendingRow).getByText('Asha Rao')).toBeInTheDocument();
    expect(within(pendingRow).getByText('WFH')).toBeInTheDocument();
    expect(within(pendingRow).getByText('Work from home Friday')).toBeInTheDocument();
    expect(within(pendingRow).getByText('Plumber visiting')).toBeInTheDocument();
    expect(within(pendingRow).getByText('02 Mar 2026')).toBeInTheDocument();
    expect(within(decidedRow).getByText('Vikram Shah')).toBeInTheDocument();
    expect(within(decidedRow).getByText('REJECTED')).toBeInTheDocument();
    expect(within(decidedRow).queryByRole('button', { name: 'approve' })).toBeNull();
  });

  it('approves a request after confirming it by subject', async () => {
    decide.mockResolvedValue({ data: { decideEmployeeRequest: { id: 'req-1' } } });
    const { refetch } = setup({ data: { teamRequests: ROWS } });

    await userEvent.click(screen.getByRole('button', { name: 'approve' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Approve “Work from home Friday”?');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Approve' }));

    await waitFor(() =>
      expect(decide).toHaveBeenCalledWith({
        variables: { id: 'req-1', status: RequestStatus.Approved },
      }),
    );
    await waitFor(() => expect(refetch).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Request approved')).toBeInTheDocument();
  });

  it('rejects a request after confirming it', async () => {
    decide.mockResolvedValue({ data: { decideEmployeeRequest: { id: 'req-1' } } });
    setup({ data: { teamRequests: ROWS } });

    await userEvent.click(screen.getByRole('button', { name: 'reject' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Reject “Work from home Friday”?');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reject' }));

    await waitFor(() =>
      expect(decide).toHaveBeenCalledWith({
        variables: { id: 'req-1', status: RequestStatus.Rejected },
      }),
    );
    expect(await screen.findByText('Request rejected')).toBeInTheDocument();
  });

  it('leaves the request alone when the confirmation is cancelled', async () => {
    setup({ data: { teamRequests: ROWS } });

    await userEvent.click(screen.getByRole('button', { name: 'approve' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(decide).not.toHaveBeenCalled();
  });

  it('says so when the team has raised nothing', () => {
    setup({ data: { teamRequests: [] } });
    expect(screen.getByText('No requests from your team.')).toBeInTheDocument();
  });

  it('shows placeholder rows while loading', () => {
    setup({ loading: true });
    expect(screen.queryByText('No requests from your team.')).toBeNull();
    expect(screen.getByRole('table').closest('[aria-busy]')).toHaveAttribute('aria-busy', 'true');
  });
});
