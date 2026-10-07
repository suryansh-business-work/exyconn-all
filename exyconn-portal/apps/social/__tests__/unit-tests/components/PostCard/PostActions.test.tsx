import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import { PostActions } from '../../../../src/components/PostCard/PostActions';

interface Counts {
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  likedByMe?: boolean;
}

function renderActions(counts: Readonly<Counts> = {}) {
  const onLike = vi.fn();
  const onShare = vi.fn();
  renderWithProviders(
    <PostActions
      postId="post-7"
      likeCount={counts.likeCount ?? 0}
      commentCount={counts.commentCount ?? 0}
      shareCount={counts.shareCount ?? 0}
      likedByMe={counts.likedByMe ?? false}
      onLike={onLike}
      onShare={onShare}
    />,
  );
  return { onLike, onShare };
}

describe('PostActions', () => {
  it('prints bare labels while nothing has happened yet', () => {
    renderActions();
    expect(screen.getByRole('button', { name: 'Like' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('link', { name: 'Comment' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
  });

  it('adds each count once there is one', () => {
    renderActions({ likeCount: 3, commentCount: 1, shareCount: 12 });
    expect(screen.getByRole('button', { name: 'Like · 3' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Comment · 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Share · 12' })).toBeInTheDocument();
  });

  it('translates the action and the count sentence', () => {
    renderWithProviders(
      <PostActions
        postId="post-7"
        likeCount={2}
        commentCount={0}
        shareCount={0}
        likedByMe={false}
        onLike={vi.fn()}
        onShare={vi.fn()}
      />,
      { messages: { Like: 'Gefällt mir', '{action} · {count}': '{action} ({count})' } },
    );
    expect(screen.getByRole('button', { name: 'Gefällt mir (2)' })).toBeInTheDocument();
  });

  it('marks the like as pressed in the error colour when the reader liked it', () => {
    renderActions({ likedByMe: true, likeCount: 1 });
    const like = screen.getByRole('button', { name: 'Like · 1' });
    expect(like).toHaveAttribute('aria-pressed', 'true');
    expect(like).toHaveClass('MuiButton-colorError');
    expect(screen.getByTestId('FavoriteIcon')).toBeInTheDocument();
  });

  it('shows the outline heart when the reader has not liked it', () => {
    renderActions();
    expect(screen.getByTestId('FavoriteBorderIcon')).toBeInTheDocument();
  });

  it('links Comment to the post page and calls back for like and share', async () => {
    const user = userEvent.setup();
    const { onLike, onShare } = renderActions();
    expect(screen.getByRole('link', { name: 'Comment' })).toHaveAttribute(
      'href',
      '/social/posts/post-7',
    );
    await user.click(screen.getByRole('button', { name: 'Like' }));
    await user.click(screen.getByRole('button', { name: 'Share' }));
    expect(onLike).toHaveBeenCalledTimes(1);
    expect(onShare).toHaveBeenCalledTimes(1);
  });
});
