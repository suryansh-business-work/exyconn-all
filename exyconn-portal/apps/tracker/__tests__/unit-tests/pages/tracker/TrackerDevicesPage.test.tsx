import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NetworkStatus } from '@apollo/client';
import { TrackerDevicesPage } from '../../../../src/pages/tracker/TrackerDevicesPage';
import { renderWithProviders } from '../../test-utils';
import { answerDevices, type DevicesState } from './devices.setup';
import { dashboardProps, resetRecorded, statPairs, tableProps } from './tracker.mocks';

const gql = vi.hoisted((): DevicesState => ({
  devices: vi.fn(),
  revoke: vi.fn(),
  settings: vi.fn(),
  access: vi.fn(),
  refetch: vi.fn(),
  revokeDevice: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useTrackerDevicesQuery: gql.devices,
  useRevokeTrackerDeviceMutation: gql.revoke,
  useTrackerSettingsQuery: gql.settings,
  useTrackerAccessListQuery: gql.access,
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

const rowOf = (hostname: string) => {
  const row = screen.getByText(hostname).closest('tr');
  if (!row) {
    throw new Error(`No row for ${hostname}`);
  }
  return within(row);
};

describe('TrackerDevicesPage', () => {
  beforeEach(() => {
    resetRecorded();
    answerDevices(gql);
  });

  it('polls the device list in the background at the desktop heartbeat', () => {
    renderWithProviders(<TrackerDevicesPage />);
    expect(gql.devices).toHaveBeenCalledWith({
      fetchPolicy: 'cache-and-network',
      pollInterval: 60_000,
      context: { background: true },
    });
  });

  it('counts devices, who is online right now, the active ones and the revoked', () => {
    renderWithProviders(<TrackerDevicesPage />);
    expect(dashboardProps().title).toBe('Tracker Devices');
    expect(dashboardProps().statsLoading).toBe(false);
    expect(statPairs()).toEqual([
      ['Devices', '3'],
      ['Online now', '1'],
      ['Active', '2'],
      ['Revoked', '1'],
    ]);
  });

  it('shows each machine with its system, platform, version, last check-in and status', () => {
    renderWithProviders(<TrackerDevicesPage />);
    const online = rowOf('asha-mbp');
    expect(online.getByText('macOS 15.1')).toBeInTheDocument();
    expect(online.getByText('darwin')).toBeInTheDocument();
    expect(online.getByText('1.9.7')).toBeInTheDocument();
    expect(online.getByText('Online')).toBeInTheDocument();
    expect(online.getByText('ACTIVE')).toBeInTheDocument();

    const quiet = rowOf('dev-thinkpad');
    expect(quiet.getByText('Windows 11')).toBeInTheDocument();
    expect(quiet.queryByText('Online')).not.toBeInTheDocument();

    const revoked = rowOf('old-imac');
    expect(revoked.queryByText('Online')).not.toBeInTheDocument();
    expect(revoked.getByText('INACTIVE')).toBeInTheDocument();
    expect(tableProps().emptyMessage).toBe('No devices enrolled.');
  });

  it("opens a device's fact sheet with the zone its hours are read in, and closes it", async () => {
    renderWithProviders(<TrackerDevicesPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Open row-2' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Asia/Dubai (UTC+04:00 · device)')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('shows placeholders, not zeros, until the list first answers', () => {
    gql.devices.mockReturnValue({
      data: undefined,
      loading: true,
      refetch: gql.refetch,
      networkStatus: NetworkStatus.loading,
    });
    renderWithProviders(<TrackerDevicesPage />);
    expect(dashboardProps().statsLoading).toBe(true);
    expect(tableProps().loading).toBe(true);
    expect(statPairs()[0]).toEqual(['Devices', '0']);
  });

  it('does not flash the table on every poll', () => {
    answerDevices(gql, { loading: true, networkStatus: NetworkStatus.poll });
    renderWithProviders(<TrackerDevicesPage />);
    expect(tableProps().loading).toBe(false);
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('refreshes the list on demand', async () => {
    renderWithProviders(<TrackerDevicesPage />);
    await tableProps().onRefresh?.();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });
});
