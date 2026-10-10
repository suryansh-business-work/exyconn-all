import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  SocialCommentsDocument,
  SocialPostDocument,
  type SocialCommentsQuery,
} from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { CommentThread } from '../../../../src/pages/post/CommentThread';
import { comment } from '../../fixtures';

interface CommentsState {
  data?: SocialCommentsQuery;
  loading: boolean;
  error?: Error;
}

const api = vi.hoisted(() => {
  const state: CommentsState = { loading: false };
  return {
    state,
    queryOptions: vi.fn<(options: unknown) => void>(),
    mutationOptions: vi.fn<(options: unknown) => void>(),
    remove: vi.fn<(options: unknown) => Promise<unknown>>(),
  };
});

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/shell/graphql/generated')>();
  return {
    ...actual,
    useSocialCommentsQuery: (options: unknown) => {
      api.queryOptions(options);
      return api.state;
    },
    useDeleteSocialCommentMutation: (options: unknown) => {
      api.mutationOptions(options);
      return [api.remove];
    },
  };
});
vi.mock(
  '@exyconn/shell/hooks/useSettings',
  async () => (await import('../../settings.mock')).settingsMock,
);

const snackbar = () => document.querySelector('.MuiSnackbar-root');
const thread = (...comments: SocialCommentsQuery['socialComments']) => ({
  data: { socialComments: comments },
  loading: false,
});

beforeEach(() => {
  api.state = { loading: false };
  api.queryOptions.mockReset();
  api.mutationOptions.mockReset();
  api.remove.mockReset().mockResolvedValue({ data: { deleteSocialComment: true } });
});

/** Opens the confirm dialog for the only deletable comment. */
async function askToDelete(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Delete comment' }));
  const dialog = await screen.findByRole('dialog');
  expect(dialog).toHaveTextContent('Delete this comment?');
  return dialog;
}

describe('CommentThread', () => {
  it('loads the thread for the post and refetches thread and post after a delete', () => {
    api.state = thread();
    renderWithProviders(<CommentThread postId="post-1" />);
    expect(api.queryOptions).toHaveBeenCalledWith({ variables: { postId: 'post-1' } });
    expect(api.mutationOptions).toHaveBeenCalledWith({
      refetchQueries: [
        { query: SocialCommentsDocument, variables: { postId: 'post-1' } },
        { query: SocialPostDocument, variables: { id: 'post-1' } },
      ],
    });
  });

  it('shows a failed thread as an error', () => {
    api.state = { loading: false, error: new Error('Thread unavailable') };
    renderWithProviders(<CommentThread postId="post-1" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Thread unavailable');
  });

  it('shows a placeholder while loading', () => {
    api.state = { loading: true };
    const { container } = renderWithProviders(<CommentThread postId="post-1" />);
    expect(container.querySelectorAll('.MuiSkeleton-root')).toHaveLength(1);
  });

  it('says so when nobody has commented', () => {
    api.state = thread();
    renderWithProviders(<CommentThread postId="post-1" />);
    expect(screen.getByText('No comments yet.')).toBeInTheDocument();
  });

  it('treats a thread with no data as empty', () => {
    api.state = { loading: false };
    renderWithProviders(<CommentThread postId="post-1" />);
    expect(screen.getByText('No comments yet.')).toBeInTheDocument();
  });

  it('lists each comment with its author, and no delete for somebody else’s', () => {
    api.state = thread(comment(), comment({ id: 'comment-2', body: 'Agreed' }));
    renderWithProviders(<CommentThread postId="post-1" />);
    expect(screen.getByText('Nice work')).toBeInTheDocument();
    expect(screen.getByText('Agreed')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Ravi Kumar' })).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'Delete comment' })).not.toBeInTheDocument();
  });

  it('deletes nothing when the reader backs out of the confirm', async () => {
    const user = userEvent.setup();
    api.state = thread(comment({ canDelete: true }));
    renderWithProviders(<CommentThread postId="post-1" />);
    const dialog = await askToDelete(user);
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(api.remove).not.toHaveBeenCalled();
  });

  it('deletes a comment once confirmed', async () => {
    const user = userEvent.setup();
    api.state = thread(comment({ canDelete: true }));
    renderWithProviders(<CommentThread postId="post-1" />);
    const dialog = await askToDelete(user);
    const confirm = within(dialog).getByRole('button', { name: 'Delete' });
    expect(confirm).toHaveClass('MuiButton-colorError');
    await user.click(confirm);
    await waitFor(() =>
      expect(api.remove).toHaveBeenCalledWith({ variables: { id: 'comment-1' } }),
    );
    expect(snackbar()).toBeNull();
  });

  it('reports a delete that failed', async () => {
    api.remove.mockRejectedValue(new Error('Not your comment'));
    const user = userEvent.setup();
    api.state = thread(comment({ canDelete: true }));
    renderWithProviders(<CommentThread postId="post-1" />);
    const dialog = await askToDelete(user);
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(snackbar()).toHaveTextContent('Not your comment'));
  });

  it('falls back to a plain message when a delete fails without an Error', async () => {
    api.remove.mockRejectedValue('offline');
    const user = userEvent.setup();
    api.state = thread(comment({ canDelete: true }));
    renderWithProviders(<CommentThread postId="post-1" />);
    const dialog = await askToDelete(user);
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(snackbar()).toHaveTextContent('Could not delete that comment'));
  });
});
