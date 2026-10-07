import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrackerDevicesPage } from '../../../../src/pages/tracker/TrackerDevicesPage';
import { renderWithProviders } from '../../test-utils';
import { answerDevices, type DevicesState } from './devices.setup';
import { resetRecorded } from './tracker.mocks';

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

const toast = () => screen.findByRole('alert', { hidden: true });

/** Presses the revoke action on the first device and returns the confirmation it raises. */
async function askToRevoke() {
  await userEvent.click(screen.getAllByRole('button', { name: 'revoke device' })[0]);
  return screen.findByRole('dialog');
}

describe('TrackerDevicesPage — revoking a device', () => {
  beforeEach(() => {
    resetRecorded();
    answerDevices(gql);
  });

  it('names the machine and leaves it signed in when the answer is no', async () => {
    renderWithProviders(<TrackerDevicesPage />);
    const dialog = await askToRevoke();
    expect(dialog).toHaveTextContent(
      'Revoke access for "asha-mbp"? The device will be signed out.',
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(gql.revokeDevice).not.toHaveBeenCalled();
  });

  it('revokes on confirmation, re-reads the list and says so', async () => {
    renderWithProviders(<TrackerDevicesPage />);
    const dialog = await askToRevoke();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Revoke' }));
    await waitFor(() =>
      expect(gql.revokeDevice).toHaveBeenCalledWith({ variables: { deviceId: 'dev-1' } }),
    );
    await waitFor(() => expect(gql.refetch).toHaveBeenCalledTimes(1));
    expect(await toast()).toHaveTextContent('Device revoked');
  });

  it('says why a revoke failed', async () => {
    gql.revokeDevice.mockRejectedValue(new Error('Device already signed out'));
    renderWithProviders(<TrackerDevicesPage />);
    const dialog = await askToRevoke();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Revoke' }));
    expect(await toast()).toHaveTextContent('Device already signed out');
    expect(gql.refetch).not.toHaveBeenCalled();
  });

  it('falls back to a plain message when a revoke fails without one', async () => {
    gql.revokeDevice.mockRejectedValue({ code: 500 });
    renderWithProviders(<TrackerDevicesPage />);
    const dialog = await askToRevoke();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Revoke' }));
    expect(await toast()).toHaveTextContent('Revoke failed');
  });
});
