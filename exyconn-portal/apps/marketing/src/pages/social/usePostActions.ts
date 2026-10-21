import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  SocialPostDeletionOutcome,
  useDeletePublishedSocialPostMutation,
  useDeleteSocialMediaPostMutation,
  usePublishSocialMediaPostNowMutation,
} from '@exyconn/shell/graphql/generated';
import type { SocialMediaPostRow } from './forms/social-post';
import { NETWORK_LABEL } from './social.labels';

/** The confirm for deleting a published post, worded for whether its network allows it. */
const deleteConfirmOf = (network: string, canDelete: boolean) => ({
  message: canDelete
    ? 'Delete this post? It is removed from {network} itself as well as from Exyconn, and cannot be brought back. If it went to several accounts together, it is deleted from each of them.'
    : "{network} doesn't let apps delete posts. This removes it from Exyconn only; delete it in the {network} app as well. Remove it from Exyconn?",
  messageValues: { network },
  confirmText: canDelete ? 'Delete post' : 'Remove from Exyconn',
  destructive: true,
});

/**
 * Publishing a post ahead of time (or again), removing one that has not gone out, and
 * deleting a published one from its network. `nameOf` names an account in the outcome.
 */
export function usePostActions(reload: () => void, nameOf: (accountId: string) => string) {
  const notify = useNotify();
  const confirm = useConfirm();
  const [publish] = usePublishSocialMediaPostNowMutation();
  const [remove] = useDeleteSocialMediaPostMutation();
  const [removePublished] = useDeletePublishedSocialPostMutation();

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

  /** One line per account it went to: what happened there, or the network's reason. */
  const deletePublished = async (post: SocialMediaPostRow, canDelete: boolean) => {
    const ok = await confirm(deleteConfirmOf(NETWORK_LABEL[post.network], canDelete));
    if (!ok) return;
    try {
      const { data } = await removePublished({ variables: { id: post.id } });
      const results = data?.deletePublishedSocialPost ?? [];
      const failed = results.some((r) => r.outcome === SocialPostDeletionOutcome.Failed);
      const report = results.map((r) => `${nameOf(r.accountId)}: ${r.message}`).join(' ');
      notify(report, failed ? 'error' : 'success');
      reload();
    } catch (error) {
      notify(errorMessage(error, 'Could not delete the post'), 'error');
    }
  };

  return { publishNow, deletePost, deletePublished };
}
