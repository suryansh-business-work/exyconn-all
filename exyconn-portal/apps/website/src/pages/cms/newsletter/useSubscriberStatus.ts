import {
  NewsletterSubscriberStatus,
  useSetNewsletterSubscriberStatusMutation,
} from '@exyconn/shell/graphql/generated';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';

/** Unsubscribes (after asking) or subscribes a person again. */
export function useSubscriberStatus(reload: () => void) {
  const [setStatus] = useSetNewsletterSubscriberStatusMutation();
  const confirm = useConfirm();
  const notify = useNotify();

  const run = async (row: { id: string; email: string }, status: NewsletterSubscriberStatus) => {
    if (status === NewsletterSubscriberStatus.Unsubscribed) {
      const ok = await confirm({
        message: 'Unsubscribe {email}? They stop getting the newsletter.',
        messageValues: { email: row.email },
        confirmText: 'Unsubscribe',
      });
      if (!ok) return;
    }
    await setStatus({ variables: { id: row.id, status } });
    notify('Subscription updated', 'success');
    reload();
  };

  return (row: { id: string; email: string }, status: NewsletterSubscriberStatus) => {
    run(row, status).catch((error: unknown) =>
      notify(errorMessage(error, 'Could not update the subscription'), 'error'),
    );
  };
}
