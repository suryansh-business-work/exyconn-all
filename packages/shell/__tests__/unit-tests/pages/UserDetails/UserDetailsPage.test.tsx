import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { useGetUserQuery } from '@/graphql/generated';
import { UserDetailsPage } from '@/pages/UserDetails';
import { portalLogger } from '@/logging/portalLogger';
import { renderWithProviders } from '../../test-utils';
import { queryResult } from '../hookMocks';
import { makeUserDetail } from './userFixture';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useGetUserQuery: vi.fn(),
}));
vi.mock('@/logging/portalLogger', () => ({ portalLogger: { warn: vi.fn(), error: vi.fn() } }));

interface ActionsStubProps {
  onChanged: () => void;
  editPath?: string;
}

// The cards and panels have their own tests; the page only wires them to the loaded user.
vi.mock('@/pages/UserDetails/UserProfileCard', () => ({ UserProfileCard: () => <p>profile</p> }));
vi.mock('@/pages/UserDetails/UserActions', () => ({
  UserActions: ({ onChanged, editPath }: Readonly<ActionsStubProps>) => (
    <button type="button" onClick={onChanged}>{`actions ${editPath ?? 'in place'}`}</button>
  ),
}));
vi.mock('@/pages/UserDetails/EmployeeLeavePanel', () => ({
  EmployeeLeavePanel: ({ employeeId }: Readonly<{ employeeId: string }>) => (
    <p>{`leave ${employeeId}`}</p>
  ),
}));
vi.mock('@/pages/UserDetails/EmployeeAttendancePanel', () => ({
  EmployeeAttendancePanel: () => <p>attendance</p>,
}));
vi.mock('@/pages/UserDetails/EmployeeLeaveBalancePanel', () => ({
  EmployeeLeaveBalancePanel: () => <p>balances</p>,
}));

function renderAt(route: string, result: ReturnType<typeof queryResult>) {
  vi.mocked(useGetUserQuery).mockReturnValue(result as never);
  renderWithProviders(
    <Routes>
      <Route path="/admin/users/:id" element={<UserDetailsPage />} />
      <Route path="/hr/employees/:id" element={<UserDetailsPage />} />
      <Route path="/admin/users" element={<p>user list</p>} />
      <Route path="/hr/employees" element={<p>employee list</p>} />
      <Route path="/admin/no-id" element={<UserDetailsPage />} />
    </Routes>,
    { route },
  );
}

const loaded = () => queryResult({ getUser: makeUserDetail() });

beforeEach(() => {
  vi.mocked(useGetUserQuery).mockReset();
});

describe('UserDetailsPage', () => {
  it('loads the user from the URL and lays out every panel for Admin', () => {
    renderAt('/admin/users/emp-1', loaded());

    expect(useGetUserQuery).toHaveBeenCalledWith({
      variables: { id: 'emp-1' },
      skip: false,
      fetchPolicy: 'cache-and-network',
    });
    expect(screen.getByRole('heading', { name: 'Employee details' })).toBeInTheDocument();
    for (const panel of ['profile', 'leave emp-1', 'attendance', 'balances']) {
      expect(screen.getByText(panel)).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: 'actions in place' })).toBeInTheDocument();
  });

  it('goes back to the user list from Admin', async () => {
    renderAt('/admin/users/emp-1', loaded());
    await userEvent.click(screen.getByRole('button', { name: 'Back to users' }));
    expect(screen.getByText('user list')).toBeInTheDocument();
  });

  it('edits on its own page and goes back to the records from HR', async () => {
    renderAt('/hr/employees/emp-1', loaded());
    expect(
      screen.getByRole('button', { name: 'actions /hr/employees/emp-1/edit' }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Back to employee records' }));
    expect(screen.getByText('employee list')).toBeInTheDocument();
  });

  it('reloads after an action and logs a reload that fails', async () => {
    const failure = new Error('reload failed');
    const result = queryResult(
      { getUser: makeUserDetail() },
      { refetch: vi.fn().mockRejectedValue(failure) },
    );
    renderAt('/admin/users/emp-1', result);

    await userEvent.click(screen.getByRole('button', { name: 'actions in place' }));
    expect(result.refetch).toHaveBeenCalledTimes(1);
    await expect
      .poll(() => vi.mocked(portalLogger.warn).mock.calls.at(-1))
      .toEqual(['Could not reload the employee', failure]);
  });

  it('spins while the first load is in flight', () => {
    renderAt('/admin/users/emp-1', queryResult(undefined, { loading: true }));
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('Employee details')).toBeNull();
  });

  it("shows the error's message", () => {
    renderAt('/admin/users/emp-1', queryResult(undefined, { error: new Error('No such user') }));
    expect(screen.getByText('No such user')).toBeInTheDocument();
  });

  it('falls back to a generic error message', () => {
    renderAt('/admin/users/emp-1', queryResult(undefined, { error: new Error('') }));
    expect(screen.getByText('Failed to load user.')).toBeInTheDocument();
  });

  it('skips the query when the URL has no id', () => {
    renderAt('/admin/no-id', queryResult(undefined));
    expect(useGetUserQuery).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { id: '' }, skip: true }),
    );
    expect(screen.queryByText('Employee details')).toBeNull();
  });
});
