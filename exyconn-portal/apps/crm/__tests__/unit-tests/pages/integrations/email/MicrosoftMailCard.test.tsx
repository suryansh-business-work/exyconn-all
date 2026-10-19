import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { MicrosoftMailCard } from '../../../../../src/pages/integrations/email/MicrosoftMailCard';
import { renderWithProviders } from '../../../test-utils';
import { press } from '../../../form-helpers';
import { microsoftAccount } from '../integration-fixtures';

const gql = vi.hoisted(() => ({ accounts: vi.fn(), refetch: vi.fn() }));
const actions = vi.hoisted(() => ({
  connect: vi.fn(),
  connecting: false,
  toggle: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useMicrosoftMailAccountsQuery: (options: unknown) => gql.accounts(options),
}));

vi.mock('../../../../../src/pages/integrations/email/useMicrosoftMailActions', () => ({
  useMicrosoftMailActions: () => actions,
}));

function answer(accounts: ReturnType<typeof microsoftAccount>[], clientReady = true) {
  gql.accounts.mockReturnValue({
    data: { microsoftMailAccounts: accounts, microsoftMailClientReady: clientReady },
    loading: false,
    error: undefined,
    refetch: gql.refetch,
  });
}

const connectButton = () => screen.getByRole('button', { name: 'Connect Microsoft account' });

describe('MicrosoftMailCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    actions.connect.mockResolvedValue(undefined);
    gql.refetch.mockResolvedValue({});
  });

  it('lists each connected mailbox with when it was last used', () => {
    answer([
      microsoftAccount(),
      microsoftAccount({ id: 'ms-2', email: 'ops@acme.io', lastUsedAt: '2026-10-02T09:30:00Z' }),
    ]);
    renderWithProviders(<MicrosoftMailCard />);

    expect(gql.accounts).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
    const never = within(screen.getByRole('article', { name: 'sales@acme.io' }));
    expect(never.getByText(/Last used: Never/)).toBeInTheDocument();
    const used = within(screen.getByRole('article', { name: 'ops@acme.io' }));
    expect(used.getByText(/Last used: /)).not.toHaveTextContent('Never');
    expect(screen.queryByText(/Microsoft mail is not set up yet/)).not.toBeInTheDocument();
  });

  it('says nothing is connected yet and starts a connection on request', async () => {
    answer([]);
    renderWithProviders(<MicrosoftMailCard />);

    expect(screen.getByText('No Microsoft mailbox connected yet.')).toBeInTheDocument();
    await userEvent.click(connectButton());

    expect(actions.connect).toHaveBeenCalledTimes(1);
  });

  it('logs a connection that fails to start', async () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    actions.connect.mockRejectedValue(new Error('offline'));
    answer([]);
    renderWithProviders(<MicrosoftMailCard />);

    await userEvent.click(connectButton());

    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        'crm: Microsoft mailboxes action failed',
        new Error('offline'),
      ),
    );
  });

  it('points to Tech and turns Connect off until the Microsoft app is saved', () => {
    answer([], false);
    renderWithProviders(<MicrosoftMailCard />);

    expect(screen.getByText(/Microsoft mail is not set up yet/)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Tech > Environment Variables > Microsoft Mail' }),
    ).toHaveAttribute(
      'href',
      expect.stringContaining('/tech/environment-variables/microsoft-mail'),
    );
    expect(connectButton()).toBeDisabled();
  });

  it('shows a skeleton while the first load runs', () => {
    gql.accounts.mockReturnValue({ data: undefined, loading: true, refetch: gql.refetch });
    renderWithProviders(<MicrosoftMailCard />);

    expect(screen.getByText('Loading the Microsoft mailboxes')).toBeInTheDocument();
    expect(screen.queryByText(/Microsoft mail is not set up yet/)).not.toBeInTheDocument();
    expect(connectButton()).toBeDisabled();
  });

  it('reports a failed load with a retry, logging a retry that fails too', async () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    gql.refetch.mockRejectedValue(new Error('still down'));
    gql.accounts.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('Server unavailable'),
      refetch: gql.refetch,
    });
    renderWithProviders(<MicrosoftMailCard />);

    expect(screen.getByText('Server unavailable')).toBeInTheDocument();
    await press('Retry');

    expect(gql.refetch).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        'crm: Microsoft mailboxes action failed',
        new Error('still down'),
      ),
    );
  });

  it('keeps showing the mailboxes when a background refresh fails', () => {
    gql.accounts.mockReturnValue({
      data: { microsoftMailAccounts: [microsoftAccount()], microsoftMailClientReady: true },
      loading: false,
      error: new Error('Server unavailable'),
      refetch: gql.refetch,
    });
    renderWithProviders(<MicrosoftMailCard />);

    expect(screen.getByRole('article', { name: 'sales@acme.io' })).toBeInTheDocument();
    expect(screen.queryByText('Server unavailable')).not.toBeInTheDocument();
  });
});
