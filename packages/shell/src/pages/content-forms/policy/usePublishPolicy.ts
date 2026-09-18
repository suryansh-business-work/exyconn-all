import { useConfirm } from '@/components/feedback/ConfirmProvider';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { usePublishPolicyMutation } from '@/graphql/generated';
import { errorMessage } from '@/utils/errorMessage';

/** What publishing needs to know about a policy row. */
interface PublishablePolicy {
  id: string;
  title: string;
  status: string;
  version: number;
}

/**
 * Publishing asks one question — has the wording changed? — because that is the only thing
 * that decides whether everybody has to sign again. Shared by Legal's register and IT's slice
 * of it, so the two ask it the same way.
 */
export function usePublishPolicy(onPublished: () => Promise<unknown> | void) {
  const [publishPolicy] = usePublishPolicyMutation();
  const confirm = useConfirm();
  const notify = useNotify();

  return async (row: PublishablePolicy) => {
    const isRepublish = row.status === 'PUBLISHED';
    const message = isRepublish
      ? 'Has the wording of "{title}" changed? Choosing yes makes it v{version} and asks everybody to sign again.'
      : 'Publish "{title}"? Staff will be able to read it straight away.';
    const ok = await confirm({
      message,
      messageValues: { title: row.title, version: row.version + 1 },
      confirmText: isRepublish ? 'Yes, new version' : 'Publish',
    });
    if (!ok) return;
    try {
      await publishPolicy({ variables: { id: row.id, raiseVersion: isRepublish } });
      await onPublished();
      notify(isRepublish ? 'Published as a new version' : 'Policy published');
    } catch (error) {
      notify(errorMessage(error, 'Could not publish'), 'error');
    }
  };
}
