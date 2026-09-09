import { useCallback } from 'react';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  SocialFeedDocument,
  useDeleteSocialPostMutation,
  useShareSocialPostMutation,
  useToggleSocialPostLikeMutation,
} from '@exyconn/shell/graphql/generated';

/**
 * Liking, sharing and deleting a post — the three things every post can have done to it,
 * wherever it is shown.
 *
 * They live together because every screen that renders a post needs all three, and each
 * one has to do the same thing about the feed afterwards. A like does not: the mutation
 * returns the post, and Apollo's cache updates the copy on every screen showing it.
 * Sharing and deleting change which posts exist, which no cached result can work out.
 */
export function useSocialActions() {
  const notify = useNotify();
  const confirm = useConfirm();
  const refetchQueries = [SocialFeedDocument];

  const [toggleLike] = useToggleSocialPostLikeMutation();
  const [sharePost] = useShareSocialPostMutation({ refetchQueries });
  const [deletePost] = useDeleteSocialPostMutation({ refetchQueries });

  const like = useCallback(
    async (id: string) => {
      try {
        await toggleLike({ variables: { id } });
      } catch (error) {
        notify(errorMessage(error, 'Could not register that like'), 'error');
      }
    },
    [toggleLike, notify],
  );

  const share = useCallback(
    async (id: string) => {
      try {
        await sharePost({ variables: { id, body: '' } });
        notify('Shared to the feed');
      } catch (error) {
        notify(errorMessage(error, 'Could not share that post'), 'error');
      }
    },
    [sharePost, notify],
  );

  /** Returns whether the post actually went, so a page showing it can navigate away. */
  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      const confirmed = await confirm({
        title: 'Delete this post?',
        message: 'It disappears from everyone’s feed, along with its likes and comments.',
        confirmText: 'Delete',
      });
      if (!confirmed) return false;
      try {
        await deletePost({ variables: { id } });
        notify('Post deleted');
        return true;
      } catch (error) {
        notify(errorMessage(error, 'Could not delete that post'), 'error');
        return false;
      }
    },
    [confirm, deletePost, notify],
  );

  return { like, share, remove };
}
