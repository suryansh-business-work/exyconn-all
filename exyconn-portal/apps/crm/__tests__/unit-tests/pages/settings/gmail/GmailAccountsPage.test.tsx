import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { appUrl } from '@exyconn/shell/config/apps';
import { GmailAccountsPage } from '../../../../../src/pages/settings/gmail';
import { renderWithProviders } from '../../../test-utils';
import { press } from '../../../form-helpers';
import { gmailAccount } from '../settings-fixtures';

const spies = vi.hoisted(() => ({
  query: vi.fn(),
  refetch: vi.fn(),
  connect: vi.fn(),
  toggle: vi.fn(),
  remove: vi.fn(),
  warn: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useGmailAccountsQuery: () => spies.query(),
}));

vi.mock('../../../../../src/pages/settings/gmail/useGmailAccountActions', () => ({
  useGmailAccountActions: () => ({
    connect: spies.connect,
    connecting: false,
    toggle: spies.toggle,
    remove: spies.remove,
  }),
}));

vi.mock('@exyconn/shell/logging/portalLogger', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/shell/logging/portalLogger')>();
  return { ...actual, portalLogger: { ...actual.portalLogger, warn: spies.warn } };
});

const answered = (gmailAccounts: unknown[], gmailClientReady = true) => ({
  data: { gmailAccounts, gmailClientReady },
  loading: false,
  error: undefined,
  refetch: spies.refetch,
});

const renderPage = () => renderWithProviders(<GmailAccountsPage />);
const headerButton = (name: string) => screen.getAllByRole('button', { name })[0];

describe('GmailAccountsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    spies.connect.mockResolvedValue(undefined);
    spies.refetch.mockResolvedValue({});
  });

  it('shows a card per connected account with when it last synced', () => {
    spies.query.mockReturnValue(
      answered([
        gmailAccount(),
        gmailAccount({ id: 'gmail-2', email: 'ops@acme.io', lastSyncAt: '2026-10-02T09:30:00Z' }),
      ]),
    );
    renderPage();

    const first = within(screen.getByRole('article', { name: 'sales@acme.io' }));
    expect(first.getByText(/Last synced: Never/)).toBeInTheDocument();
    const second = within(screen.getByRole('article', { name: 'ops@acme.io' }));
    expect(second.queryByText(/Last synced: Never/)).not.toBeInTheDocument();
    expect(second.getByText(/Last synced: .*2026/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect another Gmail' })).toBeEnabled();
    expect(screen.queryByText('No Gmail account connected')).not.toBeInTheDocument();
  });

  it('offers to connect the first account from the empty state and the header', async () => {
    spies.query.mockReturnValue(answered([]));
    renderPage();

    expect(screen.getByText('No Gmail account connected')).toBeInTheDocument();
    const buttons = screen.getAllByRole('button', { name: 'Connect Gmail' });
    expect(buttons).toHaveLength(2);
    await userEvent.click(buttons[0]);
    await userEvent.click(buttons[1]);

    expect(spies.connect).toHaveBeenCalledTimes(2);
    expect(screen.queryByText(/Gmail is not set up yet/)).not.toBeInTheDocument();
  });

  it('logs a connection that fails to start', async () => {
    const failure = new Error('popup blocked');
    spies.connect.mockRejectedValueOnce(failure);
    spies.query.mockReturnValue(answered([]));
    renderPage();

    await userEvent.click(headerButton('Connect Gmail'));

    await waitFor(() =>
      expect(spies.warn).toHaveBeenCalledWith('crm: Gmail accounts action failed', failure),
    );
  });

  it('points to Tech while the Google client is not saved, with nothing to connect', () => {
    spies.query.mockReturnValue(answered([], false));
    renderPage();

    expect(screen.getByText(/Gmail is not set up yet/)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Tech > Environment Variables > Gmail' }),
    ).toHaveAttribute('href', appUrl('tech', '/tech/environment-variables/gmail'));
    expect(screen.getAllByRole('button', { name: 'Connect Gmail' })).toHaveLength(1);
    expect(headerButton('Connect Gmail')).toBeDisabled();
  });

  it('shows a skeleton while the accounts first load', () => {
    spies.query.mockReturnValue({ data: undefined, loading: true, error: undefined });
    renderPage();

    expect(screen.getByText('Loading the Gmail accounts')).toBeInTheDocument();
    expect(headerButton('Connect Gmail')).toBeDisabled();
  });

  it('reports a failed load and retries, logging a retry that fails too', async () => {
    const failure = new Error('still down');
    spies.refetch.mockRejectedValueOnce(failure);
    spies.query.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('Network down'),
      refetch: spies.refetch,
    });
    renderPage();

    expect(screen.getByText('Network down')).toBeInTheDocument();
    await press('Retry');

    expect(spies.refetch).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(spies.warn).toHaveBeenCalledWith('crm: Gmail accounts action failed', failure),
    );
  });

  it('keeps showing the accounts it has when a refresh fails', () => {
    spies.query.mockReturnValue({
      ...answered([gmailAccount()]),
      error: new Error('Network down'),
    });
    renderPage();

    expect(screen.getByRole('article', { name: 'sales@acme.io' })).toBeInTheDocument();
    expect(screen.queryByText('Network down')).not.toBeInTheDocument();
  });
});
