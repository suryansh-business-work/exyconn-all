import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SocialCommentsDocument, SocialPostDocument } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../../../test-utils';
import { CommentForm } from '../../../../../../src/pages/post/forms/comment';

const api = vi.hoisted(() => ({
  create: vi.fn<(options: unknown) => Promise<unknown>>(),
  hookOptions: vi.fn<(options: unknown) => void>(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/shell/graphql/generated')>();
  return {
    ...actual,
    useCreateSocialCommentMutation: (options: unknown) => {
      api.hookOptions(options);
      return [api.create];
    },
  };
});

const snackbar = () => document.querySelector('.MuiSnackbar-root');
const field = () => screen.getByRole('textbox', { name: 'Add a comment' });

beforeEach(() => {
  api.create.mockReset().mockResolvedValue({ data: { createSocialComment: { id: 'comment-9' } } });
  api.hookOptions.mockReset();
});

describe('CommentForm', () => {
  it('refetches the thread and the post so the count moves with the comment', () => {
    renderWithProviders(<CommentForm postId="post-1" />);
    expect(api.hookOptions).toHaveBeenCalledWith({
      refetchQueries: [
        { query: SocialCommentsDocument, variables: { postId: 'post-1' } },
        { query: SocialPostDocument, variables: { id: 'post-1' } },
      ],
    });
    expect(screen.getByText('Up to 2000 characters.')).toBeInTheDocument();
  });

  it('refuses an empty comment and sends nothing', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommentForm postId="post-1" />);
    await user.click(screen.getByRole('button', { name: 'Comment' }));
    expect(await screen.findByText('Write something before you comment')).toBeInTheDocument();
    expect(api.create).not.toHaveBeenCalled();
  });

  it('posts the trimmed comment against the post and clears the box', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommentForm postId="post-1" />);
    await user.type(field(), '  Nice work  ');
    await user.click(screen.getByRole('button', { name: 'Comment' }));

    await waitFor(() =>
      expect(api.create).toHaveBeenCalledWith({
        variables: { postId: 'post-1', body: 'Nice work' },
      }),
    );
    await waitFor(() => expect(field()).toHaveValue(''));
    expect(snackbar()).toBeNull();
  });

  it('keeps the draft and reports why when the comment fails', async () => {
    api.create.mockRejectedValue(new Error('Post was deleted'));
    const user = userEvent.setup();
    renderWithProviders(<CommentForm postId="post-1" />);
    await user.type(field(), 'Nice work');
    await user.click(screen.getByRole('button', { name: 'Comment' }));

    await waitFor(() => expect(snackbar()).toHaveTextContent('Post was deleted'));
    expect(field()).toHaveValue('Nice work');
  });

  it('falls back to a plain message when the comment fails without an Error', async () => {
    api.create.mockRejectedValue('offline');
    const user = userEvent.setup();
    renderWithProviders(<CommentForm postId="post-1" />);
    await user.type(field(), 'Nice work');
    await user.click(screen.getByRole('button', { name: 'Comment' }));
    await waitFor(() => expect(snackbar()).toHaveTextContent('Could not post that comment'));
  });

  it('throws the draft away on cancel', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommentForm postId="post-1" />);
    await user.type(field(), 'Never mind');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(field()).toHaveValue('');
  });
});
