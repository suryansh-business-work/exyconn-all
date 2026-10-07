import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OffboardingPage } from '../../../../src/pages/lifecycle';
import { renderWithProviders } from '../../test-utils';
import { accessGrant, leaverRow } from '../page-kit/people.fixtures';

const gql = vi.hoisted(() => ({
  offboarding: vi.fn(),
  refetch: vi.fn(),
  revokeAll: vi.fn(),
  disable: vi.fn(),
}));

/** Lets one test swap the confirm dialog for a broken one; null keeps the real dialog. */
const confirmOverride = vi.hoisted(() => ({ fn: null as null | (() => Promise<boolean>) }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useItOffboardingQuery: (options: unknown) => gql.offboarding(options),
  useItRevokeAllAccessMutation: () => [gql.revokeAll],
  useItDisableLeaverAccountMutation: () => [gql.disable],
}));

vi.mock('@exyconn/shell/components/feedback/ConfirmProvider', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@exyconn/shell/components/feedback/ConfirmProvider')>();
  return {
    ...actual,
    useConfirm: () => {
      const real = actual.useConfirm();
      return confirmOverride.fn ?? real;
    },
  };
});

vi.mock(
  '@exyconn/shell/hooks/useSettings',
  async () => (await import('../page-kit/settings.mock')).settingsModule,
);

function answer(itOffboarding: unknown[], extra: Record<string, unknown> = {}) {
  return {
    data: { itOffboarding },
    loading: false,
    error: undefined,
    refetch: gql.refetch,
    ...extra,
  };
}

const prompt = 'Disable Vikram Shah? They will be signed out and unable to sign in.';

describe('OffboardingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    confirmOverride.fn = null;
    gql.revokeAll.mockResolvedValue({ data: {} });
    gql.disable.mockResolvedValue({ data: {} });
    gql.offboarding.mockReturnValue(answer([leaverRow()]));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads the leavers fresh and shows what each still owes IT', () => {
    renderWithProviders(<OffboardingPage />);

    expect(gql.offboarding).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
    expect(screen.getByRole('heading', { name: 'Employee Offboarding' })).toBeInTheDocument();
    expect(screen.getByText('NOTICE PERIOD')).toBeInTheDocument();
    expect(screen.getByText('Last day date(2026-10-31)')).toBeInTheDocument();
    expect(screen.getByText('Devices to recover: LT-7 MacBook Air')).toBeInTheDocument();
    expect(screen.getByText('Slack')).toBeInTheDocument();
    expect(screen.getByText('Handover pending')).toBeInTheDocument();
  });

  it('marks what is unknown or already done', () => {
    const leaver = leaverRow({ lastWorkingDate: null, assets: [], knowledgeTransferDone: true });
    gql.offboarding.mockReturnValue(answer([leaver]));
    renderWithProviders(<OffboardingPage />);

    expect(screen.getByText('Last day —')).toBeInTheDocument();
    expect(screen.getByText('Devices to recover: —')).toBeInTheDocument();
    expect(screen.getByText('Handover done')).toBeInTheDocument();
  });

  it('shows the empty, loading and error states', () => {
    gql.offboarding.mockReturnValue(answer([]));
    const { unmount } = renderWithProviders(<OffboardingPage />);
    expect(screen.getByText('Nobody is leaving right now.')).toBeInTheDocument();
    unmount();

    gql.offboarding.mockReturnValue({ ...answer([]), data: undefined, loading: true });
    const loading = renderWithProviders(<OffboardingPage />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    loading.unmount();

    gql.offboarding.mockReturnValue(answer([], { error: new Error('Exits are unavailable') }));
    renderWithProviders(<OffboardingPage />);
    expect(screen.getByText('Exits are unavailable')).toBeInTheDocument();
  });

  it('requests every revocation and refreshes', async () => {
    renderWithProviders(<OffboardingPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Revoke all access' }));

    expect(gql.revokeAll).toHaveBeenCalledWith({ variables: { employeeId: 'emp-2' } });
    expect(
      await screen.findByText('Revocations requested — carry them out in Access Management'),
    ).toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('has nothing to revoke once every grant already has a revocation pending', () => {
    const leaver = leaverRow({ access: [accessGrant()], revokesPending: 1 });
    gql.offboarding.mockReturnValue(answer([leaver]));
    renderWithProviders(<OffboardingPage />);

    expect(screen.getByRole('button', { name: 'Revoke all access' })).toBeDisabled();
  });

  it('disables the account once the confirm is accepted', async () => {
    renderWithProviders(<OffboardingPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Disable account' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(prompt)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Disable account' }));

    await waitFor(() =>
      expect(gql.disable).toHaveBeenCalledWith({ variables: { employeeId: 'emp-2' } }),
    );
    expect(await screen.findByText('Account disabled')).toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('leaves the account alone when the confirm is cancelled', async () => {
    renderWithProviders(<OffboardingPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Disable account' }));
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }),
    );

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(gql.disable).not.toHaveBeenCalled();
  });

  it('cannot disable an account that is already disabled', () => {
    gql.offboarding.mockReturnValue(answer([leaverRow({ accountActive: false })]));
    renderWithProviders(<OffboardingPage />);

    expect(screen.getByRole('button', { name: 'Account disabled' })).toBeDisabled();
  });

  it('logs the failure when the confirm cannot be shown', async () => {
    const failure = new Error('Dialog unavailable');
    confirmOverride.fn = () => Promise.reject(failure);
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderWithProviders(<OffboardingPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Disable account' }));

    await waitFor(() => expect(log).toHaveBeenCalledWith('Could not disable the account', failure));
    expect(gql.disable).not.toHaveBeenCalled();
  });
});
