import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useDeleteSocialMediaPostMutation,
  usePublishSocialMediaPostNowMutation,
} from '@exyconn/shell/graphql/generated';
import type { SocialMediaPostRow } from './forms/social-post';

/** Publishing a post ahead of time (or again), and removing one that has not gone out. */
export function usePostActions(reload: () => void) {
  const notify = useNotify();
  const confirm = useConfirm();
  const [publish] = usePublishSocialMediaPostNowMutation();
  const [remove] = useDeleteSocialMediaPostMutation();

  const publishNow = async (post: SocialMediaPostRow) => {
    const ok = await confirm({ message: 'Publish this post now?', confirmText: 'Publish' });
    if (!ok) return;
    try {
      const { data } = await publish({ variables: { id: post.id } });
      const sent = data?.publishSocialMediaPostNow;
      if (sent?.status === 'FAILED') notify(sent.error, 'error');
      else notify('Posted');
      reload();
    } catch (error) {
      notify(errorMessage(error, 'Could not publish'), 'error');
    }
  };

  const deletePost = async (post: SocialMediaPostRow) => {
    const ok = await confirm({
      message: 'Delete this post? It has not gone out.',
      confirmText: 'Delete',
    });
    if (!ok) return;
    try {
      await remove({ variables: { id: post.id } });
      notify('Post deleted');
      reload();
    } catch (error) {
      notify(errorMessage(error, 'Could not delete'), 'error');
    }
  };

  return { publishNow, deletePost };
}
