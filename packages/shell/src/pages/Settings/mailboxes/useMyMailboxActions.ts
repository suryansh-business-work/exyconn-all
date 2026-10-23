import { useConfirm } from '@/components/feedback/ConfirmProvider';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { portalLogger } from '@/logging/portalLogger';
import { errorMessage } from '@/utils/errorMessage';
import {
  MyMailboxesDocument,
  useDisconnectMyMailboxMutation,
  useSetDefaultMyMailboxMutation,
  useTestMyMailboxMutation,
  type MyMailboxFieldsFragment,
} from '@/graphql/generated';

type Mailbox = MyMailboxFieldsFragment;

const refetchQueries = [MyMailboxesDocument];

/** Test, Make default and Disconnect for one of the person's own mailboxes. */
export function useMyMailboxActions() {
  const notify = useNotify();
  const confirm = useConfirm();
  const [testMailbox] = useTestMyMailboxMutation();
  const [setDefault] = useSetDefaultMyMailboxMutation({ refetchQueries });
  const [disconnect] = useDisconnectMyMailboxMutation({ refetchQueries });

  /** Runs one action; a failure is logged and told, never thrown at the button. */
  const attempt = (what: string, work: () => Promise<void>) => {
    work().catch((error: unknown) => {
      portalLogger.warn(`mailbox: ${what} failed`, error);
      notify(errorMessage(error, 'That did not work. Try again.'), 'error');
    });
  };

  const test = (mailbox: Mailbox) =>
    attempt('test', async () => {
      const { data } = await testMailbox({ variables: { id: mailbox.id } });
      if (data?.testMyMailbox.lastError) {
        notify('{email} did not answer. See the details.', 'error', { email: mailbox.email });
      } else {
        notify('{email} works.', 'success', { email: mailbox.email });
      }
    });

  const makeDefault = (mailbox: Mailbox) =>
    attempt('set default', async () => {
      await setDefault({ variables: { id: mailbox.id } });
      notify('New email now goes from {email}.', 'success', { email: mailbox.email });
    });

  const remove = (mailbox: Mailbox) =>
    attempt('disconnect', async () => {
      const ok = await confirm({
        title: 'Disconnect this mailbox?',
        message: 'You can no longer send email from {email} here until you connect it again.',
        messageValues: { email: mailbox.email },
        confirmText: 'Disconnect',
        destructive: true,
      });
      if (!ok) {
        return;
      }
      await disconnect({ variables: { id: mailbox.id } });
      notify('Disconnected {email}.', 'success', { email: mailbox.email });
    });

  return { test, makeDefault, remove };
}
