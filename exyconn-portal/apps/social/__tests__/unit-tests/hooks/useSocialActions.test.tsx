import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SocialFeedDocument } from '@exyconn/shell/graphql/generated';
import { renderHookWithProviders } from '../test-utils';
import { useSocialActions } from '../../../src/hooks/useSocialActions';

const api = vi.hoisted(() => ({
  toggleLike: vi.fn<(options: unknown) => Promise<unknown>>(),
  share: vi.fn<(options: unknown) => Promise<unknown>>(),
  remove: vi.fn<(options: unknown) => Promise<unknown>>(),
  hookOptions: vi.fn<(hook: string, options: unknown) => void>(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/shell/graphql/generated')>();
  return {
    ...actual,
    useToggleSocialPostLikeMutation: () => [api.toggleLike],
    useShareSocialPostMutation: (options: unknown) => {
      api.hookOptions('share', options);
      return [api.share];
    },
    useDeleteSocialPostMutation: (options: unknown) => {
      api.hookOptions('delete', options);
      return [api.remove];
    },
  };
});

const snackbar = () => document.querySelector('.MuiSnackbar-root');

beforeEach(() => {
  api.toggleLike.mockReset().mockResolvedValue({ data: {} });
  api.share.mockReset().mockResolvedValue({ data: {} });
  api.remove.mockReset().mockResolvedValue({ data: {} });
  api.hookOptions.mockReset();
});

/** Starts a delete, which waits on the confirm dialog, and hands back its pending result. */
async function startRemove(remove: (id: string) => Promise<boolean>) {
  let pending: Promise<boolean> = Promise.resolve(false);
  act(() => {
    pending = remove('post-1');
  });
  expect(await screen.findByRole('dialog')).toHaveTextContent('Delete this post?');
  return pending;
}

describe('useSocialActions', () => {
  it('refetches the feed after a share or a delete, but not after a like', () => {
    renderHookWithProviders(() => useSocialActions());
    expect(api.hookOptions).toHaveBeenCalledWith('share', { refetchQueries: [SocialFeedDocument] });
    expect(api.hookOptions).toHaveBeenCalledWith('delete', {
      refetchQueries: [SocialFeedDocument],
    });
  });

  it('toggles a like quietly', async () => {
    const { result } = renderHookWithProviders(() => useSocialActions());
    await act(() => result.current.like('post-1'));
    expect(api.toggleLike).toHaveBeenCalledWith({ variables: { id: 'post-1' } });
    expect(snackbar()).toBeNull();
  });

  it('reports a like that failed', async () => {
    api.toggleLike.mockRejectedValue(new Error('Post not found'));
    const { result } = renderHookWithProviders(() => useSocialActions());
    await act(() => result.current.like('post-1'));
    await waitFor(() => expect(snackbar()).toHaveTextContent('Post not found'));
  });

  it('falls back to a plain message when a like fails without an Error', async () => {
    api.toggleLike.mockRejectedValue('offline');
    const { result } = renderHookWithProviders(() => useSocialActions());
    await act(() => result.current.like('post-1'));
    await waitFor(() => expect(snackbar()).toHaveTextContent('Could not register that like'));
  });

  it('shares a post with no comment of its own and says so', async () => {
    const { result } = renderHookWithProviders(() => useSocialActions());
    await act(() => result.current.share('post-1'));
    expect(api.share).toHaveBeenCalledWith({ variables: { id: 'post-1', body: '' } });
    await waitFor(() => expect(snackbar()).toHaveTextContent('Shared to the feed'));
  });

  it('reports a share that failed', async () => {
    api.share.mockRejectedValue('offline');
    const { result } = renderHookWithProviders(() => useSocialActions());
    await act(() => result.current.share('post-1'));
    await waitFor(() => expect(snackbar()).toHaveTextContent('Could not share that post'));
  });

  it('asks first and deletes nothing when the reader backs out', async () => {
    const user = userEvent.setup();
    const { result } = renderHookWithProviders(() => useSocialActions());
    const pending = await startRemove(result.current.remove);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await expect(pending).resolves.toBe(false);
    expect(api.remove).not.toHaveBeenCalled();
  });

  it('deletes the post once confirmed and reports it gone', async () => {
    const user = userEvent.setup();
    const { result } = renderHookWithProviders(() => useSocialActions());
    const pending = await startRemove(result.current.remove);
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'It disappears from everyone’s feed, along with its likes and comments.',
    );
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await expect(pending).resolves.toBe(true);
    expect(api.remove).toHaveBeenCalledWith({ variables: { id: 'post-1' } });
    await waitFor(() => expect(snackbar()).toHaveTextContent('Post deleted'));
  });

  it('reports a delete that failed and says the post is still there', async () => {
    api.remove.mockRejectedValue(new Error('Not allowed'));
    const user = userEvent.setup();
    const { result } = renderHookWithProviders(() => useSocialActions());
    const pending = await startRemove(result.current.remove);
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await expect(pending).resolves.toBe(false);
    await waitFor(() => expect(snackbar()).toHaveTextContent('Not allowed'));
  });

  it('falls back to a plain message when a delete fails without an Error', async () => {
    api.remove.mockRejectedValue('offline');
    const user = userEvent.setup();
    const { result } = renderHookWithProviders(() => useSocialActions());
    const pending = await startRemove(result.current.remove);
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await expect(pending).resolves.toBe(false);
    await waitFor(() => expect(snackbar()).toHaveTextContent('Could not delete that post'));
  });
});
