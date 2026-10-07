import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import { SocialMediaPostStatus } from '@exyconn/shell/graphql/generated';
import { usePostActions } from '../../../../src/pages/social/usePostActions';
import { renderHookWithProviders } from '../../test-utils';
import { postRow } from '../../fixtures';

const gql = vi.hoisted(() => ({
  publish: vi.fn(),
  remove: vi.fn(),
  notify: vi.fn(),
  confirm: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  usePublishSocialMediaPostNowMutation: () => [gql.publish],
  useDeleteSocialMediaPostMutation: () => [gql.remove],
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
  const { result } = renderHookWithProviders(() => usePostActions(reload));
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
});
