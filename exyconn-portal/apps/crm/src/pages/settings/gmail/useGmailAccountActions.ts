import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  CrmGmailReadyDocument,
  GmailAccountsDocument,
  useDisconnectGmailAccountMutation,
  useSetGmailAccountEnabledMutation,
  useStartGmailConnectMutation,
  type GmailAccountFieldsFragment,
} from '@exyconn/shell/graphql/generated';

const CONNECTED = 'gmailConnected';
const FAILED = 'gmailError';

/** This page's address without the outcome of an earlier try, for Google to come back to. */
function returnAddress(): string {
  const url = new URL(globalThis.location.href);
  url.searchParams.delete(CONNECTED);
  url.searchParams.delete(FAILED);
  return url.toString();
}

/**
 * Connect (another, or the same again), turn on/off and disconnect a Gmail account. Google
 * sends the browser back here with the outcome, announced once and taken off the address.
 */
export function useGmailAccountActions() {
  const notify = useNotify();
  const confirm = useConfirm();
  const [params, setParams] = useSearchParams();
  const refetchQueries = [GmailAccountsDocument, CrmGmailReadyDocument];
  const [start, { loading: connecting }] = useStartGmailConnectMutation();
  const [setEnabled] = useSetGmailAccountEnabledMutation({ refetchQueries });
  const [disconnect] = useDisconnectGmailAccountMutation({ refetchQueries });

  useEffect(() => {
    const connected = params.get(CONNECTED);
    const failed = params.get(FAILED);
    if (connected === null && failed === null) {
      return;
    }
    if (failed === null) {
      notify('Gmail connected as {email}', 'success', { email: connected ?? '' });
    } else {
      notify(failed, 'error');
    }
    const rest = new URLSearchParams(params);
    rest.delete(CONNECTED);
    rest.delete(FAILED);
    setParams(rest, { replace: true });
  }, [params, setParams, notify]);

  const run = async (action: () => Promise<unknown>, failure: string) => {
    try {
      await action();
    } catch (error) {
      portalLogger.warn('crm: a Gmail account action failed', error);
      notify(errorMessage(error, failure), 'error');
    }
  };

  const connect = () =>
    run(async () => {
      const { data } = await start({ variables: { returnTo: returnAddress() } });
      if (data?.startGmailConnect) {
        globalThis.location.assign(data.startGmailConnect);
      }
    }, 'Could not start the Gmail connection');

  const toggle = (account: GmailAccountFieldsFragment, enabled: boolean) =>
    run(
      () => setEnabled({ variables: { id: account.id, enabled } }),
      'Could not change the account',
    );

  const remove = async (account: GmailAccountFieldsFragment) => {
    const ok = await confirm({
      title: 'Disconnect Gmail',
      message:
        'Disconnect {email}? The CRM stops reading and sending from it. Emails already synced stay on the records.',
      messageValues: { email: account.email },
      confirmText: 'Disconnect',
      destructive: true,
    });
    if (ok) {
      await run(() => disconnect({ variables: { id: account.id } }), 'Could not disconnect Gmail');
    }
  };

  return { connect, connecting, toggle, remove };
}

export type GmailAccountActions = ReturnType<typeof useGmailAccountActions>;
