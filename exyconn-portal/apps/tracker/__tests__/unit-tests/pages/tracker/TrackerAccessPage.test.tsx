import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { TrackerAccessPage } from '../../../../src/pages/tracker/TrackerAccessPage';
import { renderWithProviders } from '../../test-utils';
import { answerAccess, rowOf, type AccessState } from './access.setup';
import { queryResult } from './tracker.fixtures';
import { dashboardProps, resetRecorded, statPairs, tableProps } from './tracker.mocks';

const gql = vi.hoisted((): AccessState => ({
  users: vi.fn(),
  access: vi.fn(),
  grant: vi.fn(),
  revoke: vi.fn(),
  settings: vi.fn(),
  devices: vi.fn(),
  refetchUsers: vi.fn(),
  refetchAccess: vi.fn(),
  grantAccess: vi.fn(),
  revokeAccess: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListEmployeeOptionsQuery: gql.users,
  useTrackerAccessListQuery: gql.access,
  useGrantTrackerAccessMutation: gql.grant,
  useRevokeTrackerAccessMutation: gql.revoke,
  useTrackerSettingsQuery: gql.settings,
  useTrackerDevicesQuery: gql.devices,
}));
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('./tracker.mocks')).settingsModuleMock(),
);
vi.mock('@exyconn/shell/components/data/DataTable', async () =>
  (await import('./tracker.mocks')).dataTableModuleMock(),
);
vi.mock('@exyconn/shell/components/dashboard/ModuleDashboard', async () =>
  (await import('./tracker.mocks')).moduleDashboardMock(),
);

describe('TrackerAccessPage', () => {
  beforeEach(() => {
    resetRecorded();
    answerAccess(gql);
  });

  it('counts who has access, who consented and who has none', () => {
    renderWithProviders(<TrackerAccessPage />);
    expect(dashboardProps().title).toBe('Tracker Access');
    expect(dashboardProps().statsLoading).toBe(false);
    expect(statPairs()).toEqual([
      ['Employees', '4'],
      ['With access', '2'],
      ['Consented', '2'],
      ['No access', '2'],
    ]);
    expect(gql.access).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
  });

  it('shows each employee with consent, effective timezone, grant date and the right action', () => {
    renderWithProviders(<TrackerAccessPage />);
    const asha = within(rowOf('Asha Rao'));
    expect(asha.getByText('u1@example.test')).toBeInTheDocument();
    expect(asha.getByText('Consented')).toBeInTheDocument();
    expect(asha.getByText('Europe/London')).toBeInTheDocument();
    expect(asha.getByText(/chosen$/)).toBeInTheDocument();
    expect(asha.getByText('on 2026-01-10T09:00:00.000Z')).toBeInTheDocument();
    expect(asha.getByRole('button', { name: 'Revoke' })).toBeInTheDocument();

    const ravi = within(rowOf('Ravi Kumar'));
    expect(ravi.getByText('Pending')).toBeInTheDocument();
    expect(ravi.getByText('Asia/Kolkata')).toBeInTheDocument();
    expect(ravi.getByText('UTC+05:30 · workspace default')).toBeInTheDocument();
    expect(ravi.getByText('—')).toBeInTheDocument();
    expect(ravi.getByRole('button', { name: 'Grant' })).toBeInTheDocument();

    const mira = within(rowOf('Mira Shah'));
    expect(mira.getByText('Consented')).toBeInTheDocument();
    expect(mira.getByText('—')).toBeInTheDocument();
    expect(mira.getByRole('button', { name: 'Grant' })).toBeInTheDocument();

    expect(within(rowOf('Dev Mehta')).getByText('Pending')).toBeInTheDocument();
    expect(tableProps().emptyMessage).toBe('No employees found.');
    expect(tableProps().loading).toBe(false);
  });

  it('holds the tiles while the employee list has never answered', () => {
    gql.users.mockReturnValue(queryResult(undefined, true, { refetch: gql.refetchUsers }));
    renderWithProviders(<TrackerAccessPage />);
    expect(dashboardProps().statsLoading).toBe(true);
    expect(tableProps().loading).toBe(true);
    expect(statPairs()[0]).toEqual(['Employees', '0']);
  });

  it('holds the tiles while the access list has never answered', () => {
    gql.access.mockReturnValue(queryResult(undefined, true, { refetch: gql.refetchAccess }));
    renderWithProviders(<TrackerAccessPage />);
    expect(dashboardProps().statsLoading).toBe(true);
    expect(statPairs()).toEqual([
      ['Employees', '4'],
      ['With access', '0'],
      ['Consented', '0'],
      ['No access', '4'],
    ]);
  });

  it('keeps the tiles on a background refresh but marks the table busy', () => {
    gql.access.mockReturnValue(
      queryResult({ trackerAccessList: [] }, true, { refetch: gql.refetchAccess }),
    );
    renderWithProviders(<TrackerAccessPage />);
    expect(dashboardProps().statsLoading).toBe(false);
    expect(tableProps().loading).toBe(true);
  });

  it('refreshes the employees and their access together', async () => {
    renderWithProviders(<TrackerAccessPage />);
    await tableProps().onRefresh?.();
    expect(gql.refetchUsers).toHaveBeenCalledTimes(1);
    expect(gql.refetchAccess).toHaveBeenCalledTimes(1);
  });

  it('shows an empty table when the workspace has no employees', () => {
    gql.users.mockReturnValue(queryResult({ listEmployeeOptions: [] }));
    renderWithProviders(<TrackerAccessPage />);
    expect(tableProps().rows).toEqual([]);
    expect(screen.queryByRole('button', { name: 'Grant' })).not.toBeInTheDocument();
  });
});
