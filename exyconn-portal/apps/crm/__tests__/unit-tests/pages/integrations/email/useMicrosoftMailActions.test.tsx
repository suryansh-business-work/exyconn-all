import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  CrmEmailSendersDocument,
  CrmIntegrationStatusDocument,
  MicrosoftMailAccountsDocument,
} from '@exyconn/shell/graphql/generated';
import { useMicrosoftMailActions } from '../../../../../src/pages/integrations/email/useMicrosoftMailActions';
import { renderHookWithProviders } from '../../../test-utils';
import { microsoftAccount } from '../integration-fixtures';

const gql = vi.hoisted(() => ({
  start: vi.fn(),
  setEnabled: vi.fn(),
  disconnect: vi.fn(),
  test: vi.fn(),
  options: vi.fn(),
  connecting: false,
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useStartMicrosoftMailConnectMutation: () => [gql.start, { loading: gql.connecting }],
  useTestMicrosoftMailAccountMutation: () => [gql.test],
  useSetMicrosoftMailAccountEnabledMutation: (options: unknown) => {
    gql.options('setEnabled', options);
    return [gql.setEnabled];
  },
  useDisconnectMicrosoftMailAccountMutation: (options: unknown) => {
    gql.options('disconnect', options);
    return [gql.disconnect];
  },
}));

const assign = vi.fn();
const account = microsoftAccount();

function renderActions(route = '/integrations/email') {
  return renderHookWithProviders(() => useMicrosoftMailActions(), { route }).result;
}

describe('useMicrosoftMailActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.connecting = false;
    vi.stubGlobal('location', {
      ...globalThis.location,
      href: 'https://crm.exyconn.com/integrations/email?microsoftError=old',
      assign,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('refreshes the mailboxes, status and senders after a change', () => {
    renderActions();
    const refetchQueries = [
      MicrosoftMailAccountsDocument,
      CrmIntegrationStatusDocument,
      CrmEmailSendersDocument,
    ];

    expect(gql.options).toHaveBeenCalledWith('setEnabled', { refetchQueries });
    expect(gql.options).toHaveBeenCalledWith('disconnect', { refetchQueries });
  });

  it('sends the browser to Microsoft with a clean return address', async () => {
    gql.start.mockResolvedValue({
      data: { startMicrosoftMailConnect: 'https://login.microsoftonline.com/consent' },
    });
    const result = renderActions();

    await act(() => result.current.connect());

    expect(gql.start).toHaveBeenCalledWith({
      variables: { returnTo: 'https://crm.exyconn.com/integrations/email' },
    });
    expect(assign).toHaveBeenCalledWith('https://login.microsoftonline.com/consent');
  });

  it('stays put when the server gives no consent address', async () => {
    gql.start.mockResolvedValue({ data: null });
    const result = renderActions();

    await act(() => result.current.connect());

    expect(assign).not.toHaveBeenCalled();
  });

  it('reports a connection that could not start', async () => {
    gql.start.mockRejectedValue('network');
    const result = renderActions();

    await act(() => result.current.connect());

    expect(await screen.findByText('Could not start the Microsoft connection')).toBeInTheDocument();
  });

  it('reflects a connection in progress', () => {
    gql.connecting = true;

    expect(renderActions().current.connecting).toBe(true);
  });

  it('turns a mailbox on or off, reporting a failure', async () => {
    gql.setEnabled.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('Not allowed'));
    const result = renderActions();

    await act(() => result.current.toggle(account, false));
    expect(gql.setEnabled).toHaveBeenCalledWith({ variables: { id: 'ms-1', enabled: false } });

    await act(() => result.current.toggle(account, true));
    expect(await screen.findByText('Not allowed')).toBeInTheDocument();
  });

  it('disconnects a mailbox only once confirmed', async () => {
    gql.disconnect.mockResolvedValue({});
    const result = renderActions();

    let removal: Promise<void> | undefined;
    act(() => {
      removal = result.current.remove(account);
    });
    expect(
      await screen.findByText(
        'Disconnect sales@acme.io? The CRM stops sending from it. Emails already sent stay on the records.',
      ),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Disconnect' }));
    await act(async () => {
      await removal;
    });

    expect(gql.disconnect).toHaveBeenCalledWith({ variables: { id: 'ms-1' } });
  });

  it('leaves the mailbox alone when the confirm is cancelled', async () => {
    const result = renderActions();

    let removal: Promise<void> | undefined;
    act(() => {
      removal = result.current.remove(account);
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    await act(async () => {
      await removal;
    });

    expect(gql.disconnect).not.toHaveBeenCalled();
  });

  it('announces the mailbox Microsoft just connected', async () => {
    renderActions('/integrations/email?microsoftConnected=ops%40acme.io');

    await waitFor(() =>
      expect(screen.getByText('Microsoft mailbox connected as ops@acme.io')).toBeInTheDocument(),
    );
  });

  it('reconnects a known address, testing a mailbox and saying how it went', async () => {
    gql.start.mockResolvedValue({ data: null });
    gql.test
      .mockResolvedValueOnce({ data: { testMicrosoftMailAccount: { lastError: '' } } })
      .mockResolvedValueOnce({ data: { testMicrosoftMailAccount: { lastError: 'Refused (403)' } } })
      .mockRejectedValueOnce(new Error('offline'));
    const result = renderActions();

    await act(() => result.current.connect('sales@acme.io'));
    expect(gql.start).toHaveBeenCalledWith({
      variables: {
        returnTo: 'https://crm.exyconn.com/integrations/email',
        loginHint: 'sales@acme.io',
      },
    });
    await act(() => result.current.test(account));
    expect(gql.test).toHaveBeenCalledWith({ variables: { id: account.id } });
    expect(await screen.findByText('sales@acme.io works.')).toBeInTheDocument();
    await act(() => result.current.test(account));
    expect(
      await screen.findByText('sales@acme.io failed the test. Open its error details to see why.'),
    ).toBeInTheDocument();
    await act(() => result.current.test(account));
    expect(await screen.findByText('offline')).toBeInTheDocument();
  });
});
