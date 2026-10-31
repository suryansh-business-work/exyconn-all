import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { EmailIntegrationsPanel } from '../../../../../src/pages/integrations/email/EmailIntegrationsPanel';
import { renderWithProviders } from '../../../test-utils';
import { gmailAccount, microsoftAccount } from '../integration-fixtures';

const gql = vi.hoisted(() => ({
  gmail: vi.fn(),
  microsoft: vi.fn(),
  startGmail: vi.fn(),
  setGmailEnabled: vi.fn(),
  disconnectGmail: vi.fn(),
  disconnectMicrosoft: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useGmailAccountsQuery: (options: unknown) => gql.gmail(options),
  useMicrosoftMailAccountsQuery: (options: unknown) => gql.microsoft(options),
  useStartGmailConnectMutation: () => [gql.startGmail, { loading: false }],
  useSetGmailAccountEnabledMutation: () => [gql.setGmailEnabled],
  useDisconnectGmailAccountMutation: () => [gql.disconnectGmail],
  useTestGmailAccountMutation: () => [vi.fn()],
  useStartMicrosoftMailConnectMutation: () => [vi.fn(), { loading: false }],
  useTestMicrosoftMailAccountMutation: () => [vi.fn()],
  useSetMicrosoftMailAccountEnabledMutation: () => [vi.fn()],
  useDisconnectMicrosoftMailAccountMutation: () => [gql.disconnectMicrosoft],
}));

const refetch = vi.fn();
const GOOGLE_OFF =
  'Google mailbox connections are not switched on yet. Ask your platform administrator to set them up in Tech > Environment Variables > Email accounts (OAuth).';

function answer(gmail: unknown[], microsoft: unknown[], gmailReady = true) {
  gql.gmail.mockReturnValue({
    data: { gmailAccounts: gmail, gmailClientReady: gmailReady },
    loading: false,
    refetch,
  });
  gql.microsoft.mockReturnValue({
    data: { microsoftMailAccounts: microsoft, microsoftMailClientReady: true },
    loading: false,
    refetch,
  });
}

const rowOf = (email: string) => screen.getByText(email).closest('tr')!;

describe('EmailIntegrationsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    refetch.mockResolvedValue({});
    gql.setGmailEnabled.mockResolvedValue({});
    gql.disconnectGmail.mockResolvedValue({});
  });

  it('lists every mailbox from both providers in one table', () => {
    answer(
      [gmailAccount({ lastSyncAt: '2026-10-02T09:30:00Z' })],
      [microsoftAccount({ id: 'ms-1', email: 'ops@acme.io' })],
    );
    renderWithProviders(<EmailIntegrationsPanel />);

    expect(screen.getByRole('heading', { name: 'Email' })).toBeInTheDocument();
    const headers = screen.getAllByRole('columnheader').map((cell) => cell.textContent);
    expect(headers).toEqual([
      'Mailbox',
      'Status',
      'Health',
      'Use for CRM',
      'Last activity',
      'Connected by',
      'Actions',
    ]);
    const gmail = within(rowOf('sales@acme.io'));
    expect(gmail.getByText('Gmail')).toBeInTheDocument();
    expect(gmail.getByText('Connected')).toBeInTheDocument();
    expect(gmail.getByText('Priya')).toBeInTheDocument();
    expect(gmail.queryByText('Never')).not.toBeInTheDocument();
    const microsoft = within(rowOf('ops@acme.io'));
    expect(microsoft.getByText('Microsoft')).toBeInTheDocument();
    expect(microsoft.getByText('Never')).toBeInTheDocument();
    expect(gql.gmail).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
    expect(gql.microsoft).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
  });

  it('turns a mailbox off for the CRM from its switch', async () => {
    answer([gmailAccount()], []);
    renderWithProviders(<EmailIntegrationsPanel />);

    const toggle = screen.getByRole('switch', { name: 'Use sales@acme.io for CRM' });
    expect(toggle).toBeChecked();
    await userEvent.click(toggle);

    expect(gql.setGmailEnabled).toHaveBeenCalledWith({
      variables: { id: 'gmail-1', enabled: false },
    });
  });

  it('asks before disconnecting, and disconnects only on confirmation', async () => {
    answer([gmailAccount()], []);
    renderWithProviders(<EmailIntegrationsPanel />);

    await userEvent.click(screen.getByRole('button', { name: 'Disconnect the mailbox' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Disconnect sales@acme.io?');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(gql.disconnectGmail).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Disconnect the mailbox' }));
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Disconnect' }),
    );
    await waitFor(() =>
      expect(gql.disconnectGmail).toHaveBeenCalledWith({ variables: { id: 'gmail-1' } }),
    );
    expect(gql.disconnectMicrosoft).not.toHaveBeenCalled();
  });

  it('says nothing is connected yet, with both connect buttons at hand', async () => {
    gql.startGmail.mockResolvedValue({ data: null });
    answer([], []);
    renderWithProviders(<EmailIntegrationsPanel />);

    expect(screen.getByText(/No mailbox connected yet/)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect Microsoft' })).toBeEnabled();
    await userEvent.click(screen.getByRole('button', { name: 'Connect Gmail' }));
    expect(gql.startGmail).toHaveBeenCalledTimes(1);
  });

  it('keeps Connect Gmail off, saying why, while Google is not switched on', async () => {
    vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    answer([], [], false);
    renderWithProviders(<EmailIntegrationsPanel />);

    const connect = screen.getByRole('button', { name: 'Connect Gmail' });
    expect(connect).toHaveAttribute('aria-disabled', 'true');
    expect(connect).toHaveAccessibleDescription(GOOGLE_OFF);
    expect(screen.getByRole('button', { name: 'Connect Microsoft' })).toBeEnabled();
  });

  it('shows placeholder rows with Connect off while the first load runs', () => {
    gql.gmail.mockReturnValue({ data: undefined, loading: true, refetch });
    gql.microsoft.mockReturnValue({ data: undefined, loading: true, refetch });
    renderWithProviders(<EmailIntegrationsPanel />);

    expect(screen.getByRole('table').parentElement).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'Connect Gmail' })).toBeDisabled();
  });

  it('reports a provider that failed to load with a retry, keeping the other one listed', async () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    refetch.mockRejectedValue(new Error('still down'));
    gql.gmail.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('Server unavailable'),
      refetch,
    });
    gql.microsoft.mockReturnValue({
      data: { microsoftMailAccounts: [microsoftAccount()], microsoftMailClientReady: true },
      loading: false,
      refetch,
    });
    renderWithProviders(<EmailIntegrationsPanel />);

    expect(screen.getByRole('alert')).toHaveTextContent('Server unavailable');
    expect(rowOf('sales@acme.io')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith('crm: mailbox list action failed', new Error('still down')),
    );
  });

  it('shows only the failure, not an empty table, when nothing could load', () => {
    gql.gmail.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('Down'),
      refetch,
    });
    gql.microsoft.mockReturnValue({
      data: { microsoftMailAccounts: [], microsoftMailClientReady: true },
      loading: false,
      refetch,
    });
    renderWithProviders(<EmailIntegrationsPanel />);

    expect(screen.getByRole('alert')).toHaveTextContent('Down');
    expect(screen.queryByText(/No mailbox connected yet/)).not.toBeInTheDocument();
  });
});
