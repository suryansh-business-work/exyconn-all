import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  LeaveStatus,
  useDeleteLeaveRequestMutation,
  useListLeaveRequestsQuery,
  useListUsersQuery,
  useSetLeaveStatusMutation,
} from '@exyconn/shell/graphql/generated';
import { useAuth } from '@exyconn/shell/auth/AuthContext';
import { HrPage } from '../../../../src/pages/hr';
import { renderWithProviders } from '../../test-utils';
import { mutationTuple, queryResult } from '../../harness/gql-doubles';
import { UrlProbe } from '../../harness/url-probe';
import { statFigure } from '../../harness/stat-card';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListLeaveRequestsQuery: vi.fn(),
  useDeleteLeaveRequestMutation: vi.fn(),
  useListUsersQuery: vi.fn(),
  useSetLeaveStatusMutation: vi.fn(),
}));

vi.mock('@exyconn/shell/auth/AuthContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/auth/AuthContext')>()),
  useAuth: vi.fn(),
}));

vi.mock('../../../../src/pages/hr/forms/leave-request', async () => ({
  LeaveRequestForm: (await import('../../harness/form-stub')).FormStub,
}));

const leave = [
  {
    id: 'l1',
    employeeId: 'u1',
    type: 'SICK',
    fromDate: '2026-03-10T12:00:00.000Z',
    toDate: '2026-03-11T12:00:00.000Z',
    reason: 'Flu',
    status: LeaveStatus.Pending,
  },
  {
    id: 'l2',
    employeeId: 'gone',
    type: 'CASUAL',
    fromDate: '2026-04-01T12:00:00.000Z',
    toDate: '2026-04-01T12:00:00.000Z',
    reason: 'Errand',
    status: LeaveStatus.Pending,
  },
  {
    id: 'l3',
    employeeId: 'u2',
    type: 'EARNED',
    fromDate: '2026-02-02T12:00:00.000Z',
    toDate: '2026-02-06T12:00:00.000Z',
    reason: 'Trip',
    status: LeaveStatus.Approved,
  },
];

const refetch = vi.fn();
const remove = vi.fn();
const setStatus = vi.fn();

function answer(data: unknown, loading = false) {
  vi.mocked(useListLeaveRequestsQuery).mockReturnValue(
    queryResult(data, { loading, refetch }) as never,
  );
}

function renderPage() {
  renderWithProviders(
    <>
      <HrPage />
      <UrlProbe />
    </>,
    { route: '/hr/leave' },
  );
}

const rowOf = (text: string) => screen.getByText(text).closest('tr') as HTMLElement;

beforeEach(() => {
  refetch.mockReset().mockResolvedValue({});
  remove.mockReset().mockResolvedValue({ data: {} });
  setStatus.mockReset().mockResolvedValue({ data: {} });
  answer({ listLeaveRequests: leave });
  vi.mocked(useDeleteLeaveRequestMutation).mockReturnValue(mutationTuple(remove) as never);
  vi.mocked(useSetLeaveStatusMutation).mockReturnValue(mutationTuple(setStatus) as never);
  vi.mocked(useListUsersQuery).mockReturnValue(
    queryResult({
      listUsers: [
        { id: 'u1', name: 'Asha Rao' },
        { id: 'u2', name: 'Bilal Khan' },
      ],
    }) as never,
  );
  vi.mocked(useAuth).mockReturnValue({ user: { id: 'hr-1', roles: ['HR'] } } as never);
});

describe('HrPage', () => {
  it('counts the requests by status', () => {
    renderPage();
    expect(statFigure('Requests')).toBe('3');
    expect(statFigure('Pending')).toBe('2');
    expect(statFigure('Approved')).toBe('1');
    expect(statFigure('Rejected')).toBe('0');
  });

  it('lists each request with the employee name, dates and status', () => {
    renderPage();
    const asha = rowOf('Asha Rao');
    expect(within(asha).getByText('SICK')).toBeInTheDocument();
    expect(within(asha).getByText('10 Mar 2026')).toBeInTheDocument();
    expect(within(asha).getByText('11 Mar 2026')).toBeInTheDocument();
    expect(within(asha).getByText('PENDING')).toBeInTheDocument();
    expect(within(rowOf('gone')).getByRole('button', { name: 'approve leave' })).toBeVisible();
    expect(
      within(rowOf('Bilal Khan')).queryByRole('button', { name: 'approve leave' }),
    ).not.toBeInTheDocument();
  });

  it('shows placeholders and an empty table before the first answer', () => {
    answer(undefined, true);
    renderPage();
    expect(statFigure('Requests')).toBe('');
    expect(screen.getAllByTestId('table-skeleton-row').length).toBeGreaterThan(0);
  });

  it('says so when there are no requests', () => {
    answer({ listLeaveRequests: [] });
    renderPage();
    expect(screen.getByText('No leave requests yet.')).toBeInTheDocument();
  });

  it('opens the employee behind a row', async () => {
    renderPage();
    await userEvent.click(screen.getByText('Bilal Khan'));
    expect(screen.getByLabelText('current url')).toHaveTextContent('/hr/employees/u2');
  });

  it('approves a pending request once confirmed and reloads', async () => {
    renderPage();
    await userEvent.click(within(rowOf('Asha Rao')).getByRole('button', { name: 'approve leave' }));
    expect(await screen.findByText('Approve this leave request?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));

    expect(await screen.findByText('Leave approved')).toBeInTheDocument();
    expect(setStatus).toHaveBeenCalledWith({
      variables: { id: 'l1', status: LeaveStatus.Approved },
    });
    expect(refetch).toHaveBeenCalled();
    expect(screen.getByLabelText('current url')).toHaveTextContent('/hr/leave');
  });

  it('opens a blank form for a new request and returns from it', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'New request' }));
    expect(screen.getByRole('heading', { name: 'New request' })).toBeInTheDocument();
    expect(screen.getByText('Blank form')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Back to Leave Requests' }));
    expect(screen.getByRole('heading', { name: 'Leave Requests' })).toBeInTheDocument();
  });

  it('edits a request in the form and reloads when it is saved', async () => {
    renderPage();
    await userEvent.click(within(rowOf('Asha Rao')).getByRole('button', { name: 'edit' }));
    expect(screen.getByRole('heading', { name: 'Edit request' })).toBeInTheDocument();
    expect(screen.getByText(`Form for ${JSON.stringify(leave[0])}`)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(screen.queryByText(/^Form for/)).not.toBeInTheDocument();
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('deletes a request by its id once confirmed', async () => {
    renderPage();
    await userEvent.click(within(rowOf('Bilal Khan')).getByRole('button', { name: 'delete' }));
    expect(await screen.findByText('Delete this leave request?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Leave request deleted')).toBeInTheDocument();
    expect(remove).toHaveBeenCalledWith({ variables: { id: 'l3' } });
  });
});
