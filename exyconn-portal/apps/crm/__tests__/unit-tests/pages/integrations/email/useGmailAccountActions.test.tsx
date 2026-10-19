import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  CrmEmailSendersDocument,
  CrmGmailReadyDocument,
  CrmIntegrationStatusDocument,
  GmailAccountsDocument,
} from '@exyconn/shell/graphql/generated';
import { useGmailAccountActions } from '../../../../../src/pages/integrations/email/useGmailAccountActions';
import { renderHookWithProviders } from '../../../test-utils';
import { gmailAccount } from '../integration-fixtures';

const gql = vi.hoisted(() => ({
  start: vi.fn(),
  setEnabled: vi.fn(),
  disconnect: vi.fn(),
  options: vi.fn(),
  connecting: false,
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useStartGmailConnectMutation: () => [gql.start, { loading: gql.connecting }],
  useSetGmailAccountEnabledMutation: (options: unknown) => {
    gql.options('setEnabled', options);
    return [gql.setEnabled];
  },
  useDisconnectGmailAccountMutation: (options: unknown) => {
    gql.options('disconnect', options);
    return [gql.disconnect];
  },
}));

const assign = vi.fn();
const account = gmailAccount();

function renderActions(route = '/integrations/email') {
  return renderHookWithProviders(() => useGmailAccountActions(), { route }).result;
}

/** Starts a disconnect, answers the confirmation with `answer`, and waits for it to finish. */
async function removeAnswering(result: ReturnType<typeof renderActions>, answer: string) {
  let removal: Promise<void> | undefined;
  act(() => {
    removal = result.current.remove(account);
  });
  expect(
    await screen.findByText(
      'Disconnect sales@acme.io? The CRM stops reading and sending from it. Emails already synced stay on the records.',
    ),
  ).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: answer }));
  await act(async () => {
    await removal;
  });
}

describe('useGmailAccountActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.connecting = false;
    vi.stubGlobal('location', {
      ...globalThis.location,
      href: 'https://crm.exyconn.com/integrations/email?gmailError=old',
      assign,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('refreshes the accounts, the ready flag, the status and the senders after a change', () => {
    renderActions();
    const refetchQueries = [
      GmailAccountsDocument,
      CrmGmailReadyDocument,
      CrmIntegrationStatusDocument,
      CrmEmailSendersDocument,
    ];

    expect(gql.options).toHaveBeenCalledWith('setEnabled', { refetchQueries });
    expect(gql.options).toHaveBeenCalledWith('disconnect', { refetchQueries });
  });

  it('sends the browser to Google with a clean return address', async () => {
    gql.start.mockResolvedValue({ data: { startGmailConnect: 'https://accounts.google.com/o' } });
    const result = renderActions();

    await act(() => result.current.connect());

    expect(gql.start).toHaveBeenCalledWith({
      variables: { returnTo: 'https://crm.exyconn.com/integrations/email' },
    });
    expect(assign).toHaveBeenCalledWith('https://accounts.google.com/o');
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

    expect(await screen.findByText('Could not start the Gmail connection')).toBeInTheDocument();
  });

  it('reflects a connection in progress', () => {
    gql.connecting = true;

    expect(renderActions().current.connecting).toBe(true);
  });

  it('turns an account on or off, reporting a failure', async () => {
    gql.setEnabled.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('Not allowed'));
    const result = renderActions();

    await act(() => result.current.toggle(account, false));
    expect(gql.setEnabled).toHaveBeenCalledWith({ variables: { id: 'gmail-1', enabled: false } });

    await act(() => result.current.toggle(account, true));
    expect(await screen.findByText('Not allowed')).toBeInTheDocument();
  });

  it('disconnects an account only once confirmed, reporting a failure', async () => {
    gql.disconnect.mockResolvedValueOnce({}).mockRejectedValueOnce('gone');
    const result = renderActions();

    await removeAnswering(result, 'Disconnect');
    expect(gql.disconnect).toHaveBeenCalledWith({ variables: { id: 'gmail-1' } });

    await removeAnswering(result, 'Disconnect');
    expect(await screen.findByText('Could not disconnect Gmail')).toBeInTheDocument();
  });

  it('leaves the account alone when the confirm is cancelled', async () => {
    const result = renderActions();

    await removeAnswering(result, 'Cancel');

    expect(gql.disconnect).not.toHaveBeenCalled();
  });

  it('announces the account Google just connected', async () => {
    renderActions('/integrations/email?gmailConnected=ops%40acme.io');

    await waitFor(() =>
      expect(screen.getByText('Gmail connected as ops@acme.io')).toBeInTheDocument(),
    );
  });
});
