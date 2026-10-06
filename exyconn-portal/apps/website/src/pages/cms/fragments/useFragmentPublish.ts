import { usePublishCmsFragmentMutation } from '@exyconn/shell/graphql/generated';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';

/** Publishes a fragment's draft to every page that places it; the server's refusal is shown. */
export function useFragmentPublish(reload: () => Promise<unknown>) {
  const [publish] = usePublishCmsFragmentMutation();
  const notify = useNotify();

  const run = async (fragment: { id: string; name: string }) => {
    await publish({ variables: { id: fragment.id } });
    notify('{name} is live on every page that uses it', 'success', { name: fragment.name });
    await reload();
  };

  return (fragment: { id: string; name: string }) => {
    run(fragment).catch((error: unknown) =>
      notify(errorMessage(error, 'Could not publish the fragment'), 'error'),
    );
  };
}
