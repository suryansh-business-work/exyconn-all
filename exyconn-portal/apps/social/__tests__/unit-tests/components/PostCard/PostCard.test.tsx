import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import { PostCard } from '../../../../src/components/PostCard';
import { author, post } from '../../fixtures';
import type { SocialPostFieldsFragment } from '@exyconn/shell/graphql/generated';

vi.mock(
  '@exyconn/shell/hooks/useSettings',
  async () => (await import('../../settings.mock')).settingsMock,
);

function renderCard(value: SocialPostFieldsFragment) {
  const handlers = { onLike: vi.fn(), onShare: vi.fn(), onDelete: vi.fn() };
  renderWithProviders(<PostCard post={value} {...handlers} />);
  return handlers;
}

describe('PostCard', () => {
  it('shows the byline and what was written', () => {
    renderCard(post());
    expect(screen.getByRole('link', { name: 'Asha Rao' })).toHaveAttribute(
      'href',
      '/social/people/user-1',
    );
    expect(screen.getByText('Shipped the new payroll export today')).toBeInTheDocument();
  });

  it('offers no delete button on somebody else’s post', () => {
    renderCard(post({ canDelete: false }));
    expect(screen.queryByRole('button', { name: 'Delete post' })).not.toBeInTheDocument();
  });

  it('hands the post id to onDelete when its author deletes it', async () => {
    const user = userEvent.setup();
    const { onDelete } = renderCard(post({ canDelete: true }));
    await user.click(screen.getByRole('button', { name: 'Delete post' }));
    expect(onDelete).toHaveBeenCalledWith('post-1');
  });

  it('hands the post id to onLike and onShare', async () => {
    const user = userEvent.setup();
    const { onLike, onShare } = renderCard(post());
    await user.click(screen.getByRole('button', { name: 'Like' }));
    await user.click(screen.getByRole('button', { name: 'Share' }));
    expect(onLike).toHaveBeenCalledWith('post-1');
    expect(onShare).toHaveBeenCalledWith('post-1');
  });

  it('boxes a shared original with its own byline and body', () => {
    renderCard(
      post({
        body: 'Worth a read',
        sharedFrom: {
          __typename: 'SocialPost',
          id: 'post-0',
          body: 'Our new leave policy is live',
          imageUrl: 'https://cdn.example.com/policy.png',
          createdAt: '2026-09-30T08:00:00.000Z',
          author: author({ id: 'user-9', name: 'Meera Iyer' }),
        },
      }),
    );
    const label = screen.getByText('Originally posted');
    const box = label.parentElement as HTMLElement;
    expect(within(box).getByRole('link', { name: 'Meera Iyer' })).toHaveClass(
      'MuiTypography-body2',
    );
    expect(within(box).getByText('Our new leave policy is live')).toBeInTheDocument();
    expect(box.querySelector('img[loading="lazy"]')).toHaveAttribute(
      'src',
      'https://cdn.example.com/policy.png',
    );
    expect(screen.getByText('Worth a read')).toBeInTheDocument();
  });

  it('shows no quoted original on a post of its own', () => {
    renderCard(post());
    expect(screen.queryByText('Originally posted')).not.toBeInTheDocument();
  });
});
