import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  CrmEmailSendersDocument,
  CrmIntegrationStatusDocument,
  MicrosoftMailAccountsDocument,
  useDisconnectMicrosoftMailAccountMutation,
  useSetMicrosoftMailAccountEnabledMutation,
  useStartMicrosoftMailConnectMutation,
  type MicrosoftMailAccountFieldsFragment,
} from '@exyconn/shell/graphql/generated';
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
  ];
  const [start, { loading: connecting }] = useStartMicrosoftMailConnectMutation();
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

  const connect = () =>
    run(async () => {
      const { data } = await start({ variables: { returnTo: oauthReturnAddress(RETURN_KEYS) } });
      if (data?.startMicrosoftMailConnect) {
        globalThis.location.assign(data.startMicrosoftMailConnect);
      }
    }, 'Could not start the Microsoft connection');

  const toggle = (account: MicrosoftMailAccountFieldsFragment, enabled: boolean) =>
    run(
      () => setEnabled({ variables: { id: account.id, enabled } }),
      'Could not change the mailbox',
    );

  const remove = async (account: MicrosoftMailAccountFieldsFragment) => {
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

  return { connect, connecting, toggle, remove };
}

export type MicrosoftMailActions = ReturnType<typeof useMicrosoftMailActions>;
