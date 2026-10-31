import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  CrmEmailSendersDocument,
  MailDomainHealthDocument,
  CrmIntegrationStatusDocument,
  MicrosoftMailAccountsDocument,
  useDisconnectMicrosoftMailAccountMutation,
  useSetMicrosoftMailAccountEnabledMutation,
  useTestMicrosoftMailAccountMutation,
  useStartMicrosoftMailConnectMutation,
} from '@exyconn/shell/graphql/generated';
import type { MailboxRef } from './mailboxes';
import { oauthReturnAddress, useOAuthReturnNotice } from '../../../integrations/useOAuthReturn';

/** Where Microsoft's callback puts the outcome on the address it returns to. */
const RETURN_KEYS = { connected: 'microsoftConnected', failed: 'microsoftError' };

/**
 * Connect (another, or the same again), turn on/off and disconnect a Microsoft mailbox.
 * Microsoft sends the browser back here with the outcome, announced once and taken off the address.
 */
export function useMicrosoftMailActions() {
  const notify = useNotify();
  const confirm = useConfirm();
  const refetchQueries = [
    MicrosoftMailAccountsDocument,
    CrmIntegrationStatusDocument,
    CrmEmailSendersDocument,
    MailDomainHealthDocument,
  ];
  const [start, { loading: connecting }] = useStartMicrosoftMailConnectMutation();
  const [testAccount] = useTestMicrosoftMailAccountMutation({ refetchQueries });
  const [setEnabled] = useSetMicrosoftMailAccountEnabledMutation({ refetchQueries });
  const [disconnect] = useDisconnectMicrosoftMailAccountMutation({ refetchQueries });

  useOAuthReturnNotice(RETURN_KEYS, 'Microsoft mailbox connected as {email}');

  const run = async (action: () => Promise<unknown>, failure: string) => {
    try {
      await action();
    } catch (error) {
      portalLogger.warn('crm: a Microsoft mailbox action failed', error);
      notify(errorMessage(error, failure), 'error');
    }
  };

  const connect = (loginHint?: string) =>
    run(async () => {
      const returnTo = oauthReturnAddress(RETURN_KEYS);
      const { data } = await start({ variables: { returnTo, loginHint } });
      if (data?.startMicrosoftMailConnect) {
        globalThis.location.assign(data.startMicrosoftMailConnect);
      }
    }, 'Could not start the Microsoft connection');

  const test = (account: MailboxRef) =>
    run(async () => {
      const { data } = await testAccount({ variables: { id: account.id } });
      if (data?.testMicrosoftMailAccount.lastError) {
        notify('{email} failed the test. Open its error details to see why.', 'error', {
          email: account.email,
        });
      } else {
        notify('{email} works.', 'success', { email: account.email });
      }
    }, 'Could not test the mailbox');

  const toggle = (account: MailboxRef, enabled: boolean) =>
    run(
      () => setEnabled({ variables: { id: account.id, enabled } }),
      'Could not change the mailbox',
    );

  const remove = async (account: MailboxRef) => {
    const ok = await confirm({
      title: 'Disconnect Microsoft mailbox',
      message:
        'Disconnect {email}? The CRM stops sending from it. Emails already sent stay on the records.',
      messageValues: { email: account.email },
      confirmText: 'Disconnect',
      destructive: true,
    });
    if (ok) {
      await run(
        () => disconnect({ variables: { id: account.id } }),
        'Could not disconnect the mailbox',
      );
    }
  };

  return { connect, connecting, test, toggle, remove };
}

export type MicrosoftMailActions = ReturnType<typeof useMicrosoftMailActions>;
