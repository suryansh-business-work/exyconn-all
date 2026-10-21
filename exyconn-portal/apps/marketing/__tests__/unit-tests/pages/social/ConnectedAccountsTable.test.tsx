import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEFAULT_FORMAT_SETTINGS, formatDate, formatDateTime } from '@exyconn/i18n';
import { SocialAccountKind, SocialApp, SocialNetwork } from '@exyconn/shell/graphql/generated';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { ConnectedAccountsTable } from '../../../../src/pages/social/ConnectedAccountsTable';
import type { useSocialAccounts } from '../../../../src/pages/social/useSocialAccounts';
import { renderWithProviders } from '../../test-utils';
import { accountRow } from '../../fixtures';

vi.mock('@exyconn/shell/logging/portalLogger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/logging/portalLogger')>()),
  portalLogger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

type Social = ReturnType<typeof useSocialAccounts>;

const SYNCED = '2026-09-10T08:00:00.000Z';
const EXPIRES = '2026-12-01T00:00:00.000Z';
const ACCOUNTS = [
  accountRow({ id: 'fb-1', lastSyncedAt: SYNCED, expiresAt: EXPIRES }),
  accountRow({ id: 'x-1', name: 'Acme X', handle: '', network: SocialNetwork.X }),
  accountRow({ id: 'li-1', name: 'Acme In', lastSyncedAt: SYNCED, syncError: 'Token revoked' }),
];

function socialWith(overrides: Partial<Social> = {}): Social {
  return {
    providers: [],
    accounts: ACCOUNTS,
    loading: false,
    refetch: vi.fn().mockResolvedValue({}),
    reload: vi.fn(),
    connecting: null,
    syncing: null,
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    setActive: vi.fn().mockResolvedValue(undefined),
    sync: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

const rowOf = (name: string) => screen.getByText(name).closest('tr') as HTMLElement;

describe('ConnectedAccountsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows when each account was connected, last read and until when it has access', () => {
    renderWithProviders(<ConnectedAccountsTable social={socialWith()} />);
    const facebook = within(rowOf('Acme'));

    expect(facebook.getByRole('img', { name: 'Acme · Facebook' })).toBeInTheDocument();
    expect(facebook.getByText('@acme')).toBeInTheDocument();
    expect(
      facebook.getByText(formatDate(ACCOUNTS[0].createdAt, DEFAULT_FORMAT_SETTINGS)),
    ).toBeInTheDocument();
    expect(facebook.getByText(formatDateTime(SYNCED, DEFAULT_FORMAT_SETTINGS))).toBeInTheDocument();
    expect(facebook.getByText(formatDate(EXPIRES, DEFAULT_FORMAT_SETTINGS))).toBeInTheDocument();
  });

  it('says what has not happened yet, and why the last read failed', () => {
    renderWithProviders(<ConnectedAccountsTable social={socialWith()} />);
    const x = within(rowOf('Acme X'));
    const linkedin = within(rowOf('Acme In'));

    expect(x.getByText('—')).toBeInTheDocument();
    expect(x.getByText('Not yet')).toBeInTheDocument();
    expect(x.getByText('Does not expire')).toBeInTheDocument();
    expect(linkedin.getByText('Token revoked')).toBeInTheDocument();
  });

  it('syncs one account from its row', async () => {
    const social = socialWith();
    renderWithProviders(<ConnectedAccountsTable social={social} />);

    await userEvent.click(within(rowOf('Acme X')).getByRole('button', { name: 'sync account' }));

    expect(social.sync).toHaveBeenCalledWith('x-1');
  });

  it('hides the row syncs while a sync runs', () => {
    renderWithProviders(<ConnectedAccountsTable social={socialWith({ syncing: 'all' })} />);

    expect(screen.queryByRole('button', { name: 'sync account' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'disconnect account' })).toHaveLength(3);
  });

  it('disconnects the account of a row', async () => {
    const social = socialWith();
    renderWithProviders(<ConnectedAccountsTable social={social} />);

    await userEvent.click(
      within(rowOf('Acme')).getByRole('button', { name: 'disconnect account' }),
    );

    expect(social.disconnect).toHaveBeenCalledWith(ACCOUNTS[0]);
  });

  it('logs a sync or disconnect that throws', async () => {
    const failure = new Error('offline');
    const social = socialWith({
      sync: vi.fn().mockRejectedValue(failure),
      disconnect: vi.fn().mockRejectedValue(failure),
    });
    renderWithProviders(<ConnectedAccountsTable social={social} />);
    const row = within(rowOf('Acme'));

    await userEvent.click(row.getByRole('button', { name: 'sync account' }));
    await userEvent.click(row.getByRole('button', { name: 'disconnect account' }));

    await waitFor(() => expect(portalLogger.error).toHaveBeenCalledTimes(2));
    expect(portalLogger.error).toHaveBeenCalledWith('Sync failed', failure);
    expect(portalLogger.error).toHaveBeenCalledWith('Disconnect failed', failure);
  });

  it('refreshes the accounts and says how to connect the first one', async () => {
    const social = socialWith({ accounts: [] });
    renderWithProviders(<ConnectedAccountsTable social={social} />);

    expect(
      screen.getByText('No accounts connected yet. Pick a network above to connect one.'),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Refresh table' }));
    expect(social.refetch).toHaveBeenCalledTimes(1);
  });

  it('pauses an account from the switch named after it, and turns it back on', async () => {
    const social = socialWith({
      accounts: [
        accountRow({ id: 'fb-1' }),
        accountRow({ id: 'x-2', name: 'Acme X', active: false }),
      ],
    });
    renderWithProviders(<ConnectedAccountsTable social={social} />);

    const active = screen.getByRole('switch', { name: 'Active: Acme · Facebook' });
    expect(active).toBeChecked();
    await userEvent.click(active);
    expect(social.setActive).toHaveBeenCalledWith(expect.objectContaining({ id: 'fb-1' }), false);

    const paused = screen.getByRole('switch', { name: 'Active: Acme X · Facebook' });
    expect(paused).not.toBeChecked();
    await userEvent.click(paused);
    expect(social.setActive).toHaveBeenCalledWith(expect.objectContaining({ id: 'x-2' }), true);
  });

  it('says a paused account is paused and offers no sync for it', () => {
    renderWithProviders(
      <ConnectedAccountsTable
        social={socialWith({ accounts: [accountRow({ name: 'Quiet', active: false })] })}
      />,
    );
    const row = within(rowOf('Quiet'));

    expect(row.getByText('Paused')).toBeInTheDocument();
    expect(row.queryByRole('button', { name: 'sync account' })).not.toBeInTheDocument();
    expect(row.getByRole('button', { name: 'disconnect account' })).toBeInTheDocument();
  });

  it('asks an older LinkedIn connection to reconnect, and names company pages', () => {
    const accounts = [
      accountRow({
        id: 'li-1',
        name: 'Suryansh',
        network: SocialNetwork.Linkedin,
        app: SocialApp.Linkedin,
        needsReconnect: true,
      }),
      accountRow({
        id: 'li-2',
        name: 'Exyconn',
        network: SocialNetwork.Linkedin,
        app: SocialApp.Linkedin,
        kind: SocialAccountKind.Organization,
      }),
    ];
    renderWithProviders(<ConnectedAccountsTable social={socialWith({ accounts })} />);

    expect(
      within(rowOf('Suryansh')).getByText('Reconnect LinkedIn to add your company pages'),
    ).toBeInTheDocument();
    expect(
      within(rowOf('Exyconn')).getByRole('img', { name: 'Exyconn · LinkedIn page' }),
    ).toBeInTheDocument();
  });

  it('marks a page its member no longer administers, with nothing to switch back on', () => {
    renderWithProviders(
      <ConnectedAccountsTable
        social={socialWith({
          accounts: [accountRow({ name: 'Old page', disconnectedAt: '2026-10-01T00:00:00.000Z' })],
        })}
      />,
    );
    const row = within(rowOf('Old page'));

    expect(
      row.getByText('No longer an administrator of this page — disconnected'),
    ).toBeInTheDocument();
    expect(row.queryByRole('switch')).not.toBeInTheDocument();
    expect(row.queryByRole('button', { name: 'sync account' })).not.toBeInTheDocument();
  });

  it('logs a pause that throws', async () => {
    const failure = new Error('offline');
    const social = socialWith({
      accounts: [accountRow()],
      setActive: vi.fn().mockRejectedValue(failure),
    });
    renderWithProviders(<ConnectedAccountsTable social={social} />);

    await userEvent.click(screen.getByRole('switch', { name: 'Active: Acme · Facebook' }));

    await waitFor(() =>
      expect(portalLogger.error).toHaveBeenCalledWith('Pausing an account failed', failure),
    );
  });
});
