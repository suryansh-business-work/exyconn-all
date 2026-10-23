import { CrmEmailProvider, useStartMyMailboxConnectMutation } from '@/graphql/generated';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { portalLogger } from '@/logging/portalLogger';
import { errorMessage } from '@/utils/errorMessage';
import { mailboxReturnUrl } from './mailboxConnect';

/**
 * Sends the person to Gmail's or Microsoft's consent page to connect (or renew) one of their
 * own mailboxes; they come back to the page they were on.
 */
export function useConnectMailbox() {
  const notify = useNotify();
  const [start, { loading }] = useStartMyMailboxConnectMutation();

  const connect = (provider: CrmEmailProvider, loginHint?: string) => {
    const returnTo = mailboxReturnUrl(globalThis.location.href);
    start({ variables: { provider, returnTo, loginHint } })
      .then(({ data }) => {
        const consentUrl = data?.startMyMailboxConnect;
        if (consentUrl) {
          globalThis.location.assign(consentUrl);
        }
      })
      .catch((error: unknown) => {
        portalLogger.warn('mailbox: starting a connection failed', error);
        notify(errorMessage(error, 'The mailbox could not be connected'), 'error');
      });
  };

  return { connect, connecting: loading };
}
