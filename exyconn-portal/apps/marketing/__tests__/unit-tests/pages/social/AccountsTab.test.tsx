import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SocialApp, SocialNetwork } from '@exyconn/shell/graphql/generated';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { AccountsTab } from '../../../../src/pages/social/AccountsTab';
import type { useSocialAccounts } from '../../../../src/pages/social/useSocialAccounts';
import { useConnectOutcome } from '../../../../src/pages/social/useConnectOutcome';
import { renderWithProviders } from '../../test-utils';
import { accountRow, providerRow } from '../../fixtures';

type Social = ReturnType<typeof useSocialAccounts>;

const state = vi.hoisted(() => ({ social: null as unknown }));

vi.mock('../../../../src/pages/social/useSocialAccounts', () => ({
  useSocialAccounts: () => state.social,
}));
vi.mock('../../../../src/pages/social/useConnectOutcome', () => ({ useConnectOutcome: vi.fn() }));
vi.mock('../../../../src/pages/social/ConnectedAccountsTable', () => ({
  ConnectedAccountsTable: ({ social }: Readonly<{ social: Social }>) => (
    <p>{`${social.accounts.length} connected`}</p>
  ),
}));
vi.mock('@exyconn/shell/logging/portalLogger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/logging/portalLogger')>()),
  portalLogger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const PROVIDERS = [
  providerRow(),
  providerRow({ app: SocialApp.Linkedin, label: 'LinkedIn', networks: [SocialNetwork.Linkedin] }),
];

function socialWith(overrides: Partial<Social> = {}): Social {
  const social = {
    providers: PROVIDERS,
    accounts: [accountRow()],
    loading: false,
    refetch: vi.fn(),
    reload: vi.fn(),
    connecting: null,
    syncing: null,
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn(),
    sync: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as Social;
  state.social = social;
  return social;
}

describe('AccountsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('announces a finished connection and reloads the accounts with it', () => {
    const social = socialWith();
    renderWithProviders(<AccountsTab />);

    expect(useConnectOutcome).toHaveBeenCalledWith(social.reload);
    expect(screen.getByText('1 connected')).toBeInTheDocument();
  });

  it('offers each provider and connects the one chosen', async () => {
    const social = socialWith();
    renderWithProviders(<AccountsTab />);

    expect(screen.getByText('Meta')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: 'Connect' })[1]);

    expect(social.connect).toHaveBeenCalledWith(SocialApp.Linkedin);
  });

  it('marks only the provider being connected as busy', () => {
    socialWith({ connecting: SocialApp.Meta });
    renderWithProviders(<AccountsTab />);

    expect(screen.getByRole('button', { name: 'Opening…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Connect' })).toBeEnabled();
  });

  it('syncs every account at once', async () => {
    const social = socialWith();
    renderWithProviders(<AccountsTab />);

    await userEvent.click(screen.getByRole('button', { name: 'Sync all' }));

    expect(social.sync).toHaveBeenCalledWith();
  });

  it('cannot sync with no accounts, or while a sync runs', () => {
    socialWith({ accounts: [] });
    const { unmount } = renderWithProviders(<AccountsTab />);
    expect(screen.getByRole('button', { name: 'Sync all' })).toBeDisabled();
    unmount();

    socialWith({ syncing: 'all' });
    renderWithProviders(<AccountsTab />);
    expect(screen.getByRole('button', { name: 'Syncing…' })).toBeDisabled();
  });

  it('logs a connection or a sync that throws', async () => {
    const failure = new Error('offline');
    socialWith({
      connect: vi.fn().mockRejectedValue(failure),
      sync: vi.fn().mockRejectedValue(failure),
    });
    renderWithProviders(<AccountsTab />);

    await userEvent.click(screen.getAllByRole('button', { name: 'Connect' })[0]);
    await userEvent.click(screen.getByRole('button', { name: 'Sync all' }));

    await waitFor(() => expect(portalLogger.error).toHaveBeenCalledTimes(2));
    expect(portalLogger.error).toHaveBeenCalledWith('Starting a social connection failed', failure);
    expect(portalLogger.error).toHaveBeenCalledWith('Sync failed', failure);
  });
});
