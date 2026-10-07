import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrackerAccessPage } from '../../../../src/pages/tracker/TrackerAccessPage';
import { renderWithProviders } from '../../test-utils';
import { answerAccess, rowOf, type AccessState } from './access.setup';
import { resetRecorded } from './tracker.mocks';

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

const toast = () => screen.findByRole('alert', { hidden: true });

const pressInRow = (name: string, button: string) =>
  userEvent.click(within(rowOf(name)).getByRole('button', { name: button }));

describe('TrackerAccessPage — granting and revoking', () => {
  beforeEach(() => {
    resetRecorded();
    answerAccess(gql);
  });

  it('grants access, re-reads the list and says the employee will be emailed', async () => {
    renderWithProviders(<TrackerAccessPage />);
    await pressInRow('Ravi Kumar', 'Grant');
    expect(gql.grantAccess).toHaveBeenCalledWith({ variables: { userId: 'u3' } });
    await waitFor(() => expect(gql.refetchAccess).toHaveBeenCalledTimes(1));
    expect(await toast()).toHaveTextContent('Access granted — Ravi Kumar will receive an email');
  });

  it('says why a grant failed', async () => {
    gql.grantAccess.mockRejectedValue(new Error('Seat limit reached'));
    renderWithProviders(<TrackerAccessPage />);
    await pressInRow('Ravi Kumar', 'Grant');
    expect(await toast()).toHaveTextContent('Seat limit reached');
    expect(gql.refetchAccess).not.toHaveBeenCalled();
  });

  it('falls back to a plain message when a grant fails without one', async () => {
    gql.grantAccess.mockRejectedValue('offline');
    renderWithProviders(<TrackerAccessPage />);
    await pressInRow('Mira Shah', 'Grant');
    expect(await toast()).toHaveTextContent('Grant failed');
  });

  it('asks before revoking and leaves access alone when the answer is no', async () => {
    renderWithProviders(<TrackerAccessPage />);
    await pressInRow('Asha Rao', 'Revoke');
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Revoke tracker access for "Asha Rao"?');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(gql.revokeAccess).not.toHaveBeenCalled();
  });

  it('revokes on confirmation, re-reads the list and says so', async () => {
    renderWithProviders(<TrackerAccessPage />);
    await pressInRow('Dev Mehta', 'Revoke');
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Revoke' }));
    await waitFor(() =>
      expect(gql.revokeAccess).toHaveBeenCalledWith({ variables: { userId: 'u2' } }),
    );
    await waitFor(() => expect(gql.refetchAccess).toHaveBeenCalledTimes(1));
    expect(await toast()).toHaveTextContent('Access revoked');
  });

  it('says why a revoke failed', async () => {
    gql.revokeAccess.mockRejectedValue(new Error('Already revoked'));
    renderWithProviders(<TrackerAccessPage />);
    await pressInRow('Asha Rao', 'Revoke');
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Revoke' }),
    );
    expect(await toast()).toHaveTextContent('Already revoked');
    expect(gql.refetchAccess).not.toHaveBeenCalled();
  });

  it('falls back to a plain message when a revoke fails without one', async () => {
    gql.revokeAccess.mockRejectedValue(42);
    renderWithProviders(<TrackerAccessPage />);
    await pressInRow('Asha Rao', 'Revoke');
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Revoke' }),
    );
    expect(await toast()).toHaveTextContent('Revoke failed');
  });
});
