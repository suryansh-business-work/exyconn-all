import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  CrmGmailReadyDocument,
  CrmIntegrationStatusDocument,
  CrmEmailSendersDocument,
  MailDomainHealthDocument,
  GmailAccountsDocument,
  useDisconnectGmailAccountMutation,
  useSetGmailAccountEnabledMutation,
  useTestGmailAccountMutation,
  useStartGmailConnectMutation,
} from '@exyconn/shell/graphql/generated';
import type { MailboxRef } from './mailboxes';
import { oauthReturnAddress, useOAuthReturnNotice } from '../../../integrations/useOAuthReturn';

/** Where Google's callback puts the outcome on the address it returns to. */
const RETURN_KEYS = { connected: 'gmailConnected', failed: 'gmailError' };

/**
 * Connect (another, or the same again), turn on/off and disconnect a Gmail account. Google
 * sends the browser back here with the outcome, announced once and taken off the address.
 */
export function useGmailAccountActions() {
  const notify = useNotify();
  const confirm = useConfirm();
  const refetchQueries = [
    GmailAccountsDocument,
    CrmGmailReadyDocument,
    CrmIntegrationStatusDocument,
    CrmEmailSendersDocument,
    MailDomainHealthDocument,
  ];
  const [start, { loading: connecting }] = useStartGmailConnectMutation();
  const [testAccount] = useTestGmailAccountMutation({ refetchQueries });
  const [setEnabled] = useSetGmailAccountEnabledMutation({ refetchQueries });
  const [disconnect] = useDisconnectGmailAccountMutation({ refetchQueries });

  useOAuthReturnNotice(RETURN_KEYS, 'Gmail connected as {email}');

  const run = async (action: () => Promise<unknown>, failure: string) => {
    try {
      await action();
    } catch (error) {
      portalLogger.warn('crm: a Gmail account action failed', error);
      notify(errorMessage(error, failure), 'error');
    }
  };

  const connect = (loginHint?: string) =>
    run(async () => {
      const returnTo = oauthReturnAddress(RETURN_KEYS);
      const { data } = await start({ variables: { returnTo, loginHint } });
      if (data?.startGmailConnect) {
        globalThis.location.assign(data.startGmailConnect);
      }
    }, 'Could not start the Gmail connection');

  const test = (account: MailboxRef) =>
    run(async () => {
      const { data } = await testAccount({ variables: { id: account.id } });
      if (data?.testGmailAccount.lastError) {
        notify('{email} failed the test. Open its error details to see why.', 'error', {
          email: account.email,
        });
      } else {
        notify('{email} works.', 'success', { email: account.email });
      }
    }, 'Could not test the account');

  const toggle = (account: MailboxRef, enabled: boolean) =>
    run(
      () => setEnabled({ variables: { id: account.id, enabled } }),
      'Could not change the account',
    );

  const remove = async (account: MailboxRef) => {
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

  return { connect, connecting, test, toggle, remove };
}

export type GmailAccountActions = ReturnType<typeof useGmailAccountActions>;
