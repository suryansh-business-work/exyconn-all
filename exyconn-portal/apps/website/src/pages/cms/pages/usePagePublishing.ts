import {
  usePublishCmsPageMutation,
  useUnpublishCmsPageMutation,
} from '@exyconn/shell/graphql/generated';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';

interface PageRef {
  id: string;
  title: string;
}

/**
 * Publish puts the saved draft live (the server compiles it and refuses one it cannot
 * render, with the reason); unpublish takes the page off the site after asking.
 */
export function usePagePublishing(reload: () => void) {
  const [publishPage] = usePublishCmsPageMutation();
  const [unpublishPage] = useUnpublishCmsPageMutation();
  const confirm = useConfirm();
  const notify = useNotify();

  const publish = async (page: PageRef) => {
    await publishPage({ variables: { id: page.id } });
    notify('{title} is live', 'success', { title: page.title });
    reload();
  };

  const unpublish = async (page: PageRef) => {
    const ok = await confirm({
      title: 'Unpublish {title}?',
      titleValues: { title: page.title },
      message:
        'Visitors will get the not-found page. The draft is kept and can be published again.',
      confirmText: 'Unpublish',
      destructive: true,
    });
    if (!ok) return;
    await unpublishPage({ variables: { id: page.id } });
    notify('{title} is no longer on the site', 'success', { title: page.title });
    reload();
  };

  return {
    publish: (page: PageRef) => {
      publish(page).catch((error: unknown) =>
        notify(errorMessage(error, 'Could not publish the page'), 'error'),
      );
    },
    unpublish: (page: PageRef) => {
      unpublish(page).catch((error: unknown) =>
        notify(errorMessage(error, 'Could not unpublish the page'), 'error'),
      );
    },
  };
}
