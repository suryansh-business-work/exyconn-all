import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useListUsersQuery } from '@exyconn/shell/graphql/generated';
import { useAuth } from '@exyconn/shell/auth/AuthContext';
import { EmployeeRecordsPage } from '../../../../src/pages/hr';
import { renderWithProviders } from '../../test-utils';
import { queryResult } from '../../harness/gql-doubles';
import { UrlProbe } from '../../harness/url-probe';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListUsersQuery: vi.fn(),
}));

vi.mock('@exyconn/shell/auth/AuthContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/auth/AuthContext')>()),
  useAuth: vi.fn(),
}));

const complete = {
  id: 'u1',
  name: 'Asha Rao',
  email: 'asha@example.com',
  department: 'Engineering',
  designation: 'Engineer',
  teamName: 'Platform',
  locationCode: 'BLR',
  shiftCode: 'GEN',
  managerName: 'Maya Iyer',
  joinDate: '2025-06-02T12:00:00.000Z',
  workLocation: 'REMOTE',
  workHoursPerDay: 6,
  employmentStatus: 'ACTIVE',
  isActive: true,
  isBlocked: false,
};

const sparse = {
  id: 'u2',
  name: 'Bilal Khan',
  email: 'bilal@example.com',
  department: null,
  designation: null,
  teamName: '',
  locationCode: null,
  shiftCode: '',
  managerName: null,
  joinDate: null,
  workLocation: null,
  workHoursPerDay: null,
  employmentStatus: 'ON_LEAVE',
  isActive: false,
  isBlocked: true,
};

const refetch = vi.fn();

function renderPage(roles: string[] | null) {
  vi.mocked(useAuth).mockReturnValue({
    user: roles ? { id: 'me', name: 'Me', email: 'me@example.com', roles } : null,
  } as never);
  renderWithProviders(
    <>
      <EmployeeRecordsPage />
      <UrlProbe />
    </>,
    { route: '/hr/employees' },
  );
}

const cellsOf = (name: string) =>
  within(screen.getByText(name).closest('tr') as HTMLElement)
    .getAllByRole('cell')
    .map((cell) => cell.textContent);

beforeEach(() => {
  refetch.mockReset().mockResolvedValue({});
  vi.mocked(useListUsersQuery).mockReturnValue(
    queryResult({ listUsers: [complete, sparse] }, { refetch }) as never,
  );
});

describe('EmployeeRecordsPage', () => {
  it('lists every field of a complete record', () => {
    renderPage(['HR']);
    expect(cellsOf('Asha Rao')).toEqual([
      'Asha Rao',
      'asha@example.com',
      'Engineering',
      'Engineer',
      'Platform',
      'BLR',
      'GEN',
      'Maya Iyer',
      '02 Jun 2025',
      'REMOTE',
      '6 h',
      'ACTIVE',
      'ACTIVE',
    ]);
  });

  it('writes a dash for what a sparse record leaves out, and the default hours', () => {
    renderPage(['HR']);
    const cells = cellsOf('Bilal Khan');
    expect(cells.slice(2, 8)).toEqual(['—', '—', '—', '—', '—', '—']);
    expect(cells[8]).toBe('');
    expect(cells[9]).toBe('OFFICE');
    expect(cells[10]).toMatch(/^\d+(\.\d+)? h$/);
    expect(cells.slice(11)).toEqual(['ON LEAVE', 'BLOCKED']);
  });

  it('lets HR add an employee from the header', async () => {
    renderPage(['HR']);
    await userEvent.click(screen.getByRole('button', { name: 'New employee' }));
    expect(screen.getByLabelText('current url')).toHaveTextContent('/hr/employees/new');
  });

  it('lets an administrator add an employee too', () => {
    renderPage(['EMPLOYEE', 'ADMIN']);
    expect(screen.getByRole('button', { name: 'New employee' })).toBeInTheDocument();
  });

  it('offers no add button to anybody else, or to nobody signed in', () => {
    renderPage(['EMPLOYEE']);
    expect(screen.queryByRole('button', { name: 'New employee' })).not.toBeInTheDocument();
  });

  it('offers no add button while nobody is signed in', () => {
    renderPage(null);
    expect(screen.queryByRole('button', { name: 'New employee' })).not.toBeInTheDocument();
  });

  it('opens the employee a row belongs to', async () => {
    renderPage(['HR']);
    await userEvent.click(screen.getByText('bilal@example.com'));
    expect(screen.getByLabelText('current url')).toHaveTextContent('/hr/employees/u2');
  });

  it('says so when there are no employees, and refreshes on request', async () => {
    vi.mocked(useListUsersQuery).mockReturnValue(queryResult(undefined, { refetch }) as never);
    renderPage(['HR']);
    expect(screen.getByText('No employees yet.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Refresh table' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
