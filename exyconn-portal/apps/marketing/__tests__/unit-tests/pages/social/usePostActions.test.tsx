import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import {
  SocialMediaPostStatus,
  SocialNetwork,
  SocialPostDeletionOutcome,
} from '@exyconn/shell/graphql/generated';
import { usePostActions } from '../../../../src/pages/social/usePostActions';
import { renderHookWithProviders } from '../../test-utils';
import { postRow } from '../../fixtures';

const gql = vi.hoisted(() => ({
  publish: vi.fn(),
  remove: vi.fn(),
  removePublished: vi.fn(),
  notify: vi.fn(),
  confirm: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  usePublishSocialMediaPostNowMutation: () => [gql.publish],
  useDeleteSocialMediaPostMutation: () => [gql.remove],
  useDeletePublishedSocialPostMutation: () => [gql.removePublished],
}));
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@exyconn/shell/components/feedback/NotificationProvider')
  >()),
  useNotify: () => gql.notify,
}));
vi.mock('@exyconn/shell/components/feedback/ConfirmProvider', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/components/feedback/ConfirmProvider')>()),
  useConfirm: () => gql.confirm,
}));

const POST = postRow({ id: 'post-3' });

function renderActions() {
  const reload = vi.fn();
  const names: Record<string, string> = { 'fb-1': 'Acme · Facebook', 'ig-1': 'acme · Instagram' };
  const { result } = renderHookWithProviders(() => usePostActions(reload, (id) => names[id] ?? id));
  return { actions: result.current, reload };
}

describe('usePostActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.confirm.mockResolvedValue(true);
  });

  it('publishes a post now once confirmed, and reloads', async () => {
    gql.publish.mockResolvedValue({
      data: { publishSocialMediaPostNow: postRow({ status: SocialMediaPostStatus.Published }) },
    });
    const { actions, reload } = renderActions();

    await act(() => actions.publishNow(POST));

    expect(gql.confirm).toHaveBeenCalledWith({
      message: 'Publish this post now?',
      confirmText: 'Publish',
    });
    expect(gql.publish).toHaveBeenCalledWith({ variables: { id: 'post-3' } });
    expect(gql.notify).toHaveBeenCalledWith('Posted');
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("reports the network's reason when the post failed to go out", async () => {
    gql.publish.mockResolvedValue({
      data: {
        publishSocialMediaPostNow: postRow({
          status: SocialMediaPostStatus.Failed,
          error: 'Instagram needs an image',
        }),
      },
    });
    const { actions, reload } = renderActions();

    await act(() => actions.publishNow(POST));

    expect(gql.notify).toHaveBeenCalledWith('Instagram needs an image', 'error');
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('says posted when the server returns nothing to inspect', async () => {
    gql.publish.mockResolvedValue({ data: null });
    const { actions } = renderActions();

    await act(() => actions.publishNow(POST));

    expect(gql.notify).toHaveBeenCalledWith('Posted');
  });

  it('does nothing when publishing is cancelled', async () => {
    gql.confirm.mockResolvedValue(false);
    const { actions, reload } = renderActions();

    await act(() => actions.publishNow(POST));
    await act(() => actions.deletePost(POST));

    expect(gql.publish).not.toHaveBeenCalled();
    expect(gql.remove).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it('reports a publish that could not be sent', async () => {
    gql.publish.mockRejectedValue('offline');
    const { actions, reload } = renderActions();

    await act(() => actions.publishNow(POST));

    expect(gql.notify).toHaveBeenCalledWith('Could not publish', 'error');
    expect(reload).not.toHaveBeenCalled();
  });

  it('deletes an unsent post once confirmed, and reloads', async () => {
    gql.remove.mockResolvedValue({ data: { deleteSocialMediaPost: true } });
    const { actions, reload } = renderActions();

    await act(() => actions.deletePost(POST));

    expect(gql.confirm).toHaveBeenCalledWith({
      message: 'Delete this post? It has not gone out.',
      confirmText: 'Delete',
    });
    expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'post-3' } });
    expect(gql.notify).toHaveBeenCalledWith('Post deleted');
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('reports a delete that failed', async () => {
    gql.remove.mockRejectedValue(new Error('Already published'));
    const { actions, reload } = renderActions();

    await act(() => actions.deletePost(POST));

    expect(gql.notify).toHaveBeenCalledWith('Already published', 'error');
    expect(reload).not.toHaveBeenCalled();
  });

  describe('deleting a published post', () => {
    const PUBLISHED = postRow({ id: 'post-9', status: SocialMediaPostStatus.Published });
    const result = (accountId: string, outcome: SocialPostDeletionOutcome, message: string) => ({
      __typename: 'SocialPostDeletion' as const,
      postId: `${accountId}-post`,
      accountId,
      network: SocialNetwork.Facebook,
      outcome,
      message,
    });

    it('says plainly that the post leaves the network too, and reports each account', async () => {
      gql.removePublished.mockResolvedValue({
        data: {
          deletePublishedSocialPost: [
            result('fb-1', SocialPostDeletionOutcome.Deleted, 'Deleted from Facebook and Exyconn.'),
          ],
        },
      });
      const { actions, reload } = renderActions();

      await act(() => actions.deletePublished(PUBLISHED, true));

      expect(gql.confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          messageValues: { network: 'Facebook' },
          confirmText: 'Delete post',
          destructive: true,
        }),
      );
      expect(gql.confirm.mock.calls[0][0].message).toContain('removed from {network} itself');
      expect(gql.removePublished).toHaveBeenCalledWith({ variables: { id: 'post-9' } });
      expect(gql.notify).toHaveBeenCalledWith(
        'Acme · Facebook: Deleted from Facebook and Exyconn.',
        'success',
      );
      expect(reload).toHaveBeenCalledTimes(1);
    });

    it('tells the person a network that cannot delete keeps the post', async () => {
      gql.removePublished.mockResolvedValue({
        data: {
          deletePublishedSocialPost: [
            result(
              'ig-1',
              SocialPostDeletionOutcome.KeptOnNetwork,
              "Removed from Exyconn. Instagram doesn't let apps delete posts. Delete it in the Instagram app.",
            ),
          ],
        },
      });
      const { actions } = renderActions();

      await act(() =>
        actions.deletePublished({ ...PUBLISHED, network: SocialNetwork.Instagram }, false),
      );

      expect(gql.confirm.mock.calls[0][0]).toMatchObject({
        messageValues: { network: 'Instagram' },
        confirmText: 'Remove from Exyconn',
        destructive: true,
      });
      expect(gql.confirm.mock.calls[0][0].message).toContain("doesn't let apps delete posts");
      expect(gql.notify).toHaveBeenCalledWith(
        "acme · Instagram: Removed from Exyconn. Instagram doesn't let apps delete posts. Delete it in the Instagram app.",
        'success',
      );
    });

    it('reports as an error when any account refused, naming each', async () => {
      gql.removePublished.mockResolvedValue({
        data: {
          deletePublishedSocialPost: [
            result('fb-1', SocialPostDeletionOutcome.Failed, 'Facebook refused: token expired'),
            result('x-1', SocialPostDeletionOutcome.Deleted, 'Deleted from X and Exyconn.'),
          ],
        },
      });
      const { actions } = renderActions();

      await act(() => actions.deletePublished(PUBLISHED, true));

      expect(gql.notify).toHaveBeenCalledWith(
        'Acme · Facebook: Facebook refused: token expired x-1: Deleted from X and Exyconn.',
        'error',
      );
    });

    it('does nothing when cancelled, and reports a request that failed', async () => {
      gql.confirm.mockResolvedValueOnce(false);
      const { actions, reload } = renderActions();
      await act(() => actions.deletePublished(PUBLISHED, true));
      expect(gql.removePublished).not.toHaveBeenCalled();

      gql.removePublished.mockRejectedValue('offline');
      await act(() => actions.deletePublished(PUBLISHED, true));
      expect(gql.notify).toHaveBeenCalledWith('Could not delete the post', 'error');
      expect(reload).not.toHaveBeenCalled();
    });
  });
});
