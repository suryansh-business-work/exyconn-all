import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test-utils';
import { PostList } from '../../../src/components/PostList';
import { post } from '../fixtures';

const actions = vi.hoisted(() => ({
  like: vi.fn<(id: string) => Promise<void>>(),
  share: vi.fn<(id: string) => Promise<void>>(),
  remove: vi.fn<(id: string) => Promise<boolean>>(),
}));

vi.mock('../../../src/hooks/useSocialActions', () => ({ useSocialActions: () => actions }));
vi.mock(
  '@exyconn/shell/hooks/useSettings',
  async () => (await import('../settings.mock')).settingsMock,
);

const EMPTY = 'Nothing here yet.';

beforeEach(() => {
  actions.like.mockReset().mockResolvedValue(undefined);
  actions.share.mockReset().mockResolvedValue(undefined);
  actions.remove.mockReset().mockResolvedValue(true);
});

describe('PostList', () => {
  it('shows the error instead of anything else', () => {
    renderWithProviders(
      <PostList
        posts={[post()]}
        loading
        error={new Error('Feed unavailable')}
        emptyMessage={EMPTY}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Feed unavailable');
    expect(screen.queryByText('Shipped the new payroll export today')).not.toBeInTheDocument();
  });

  it('shows three placeholder cards while loading', () => {
    const { container } = renderWithProviders(<PostList posts={[]} loading emptyMessage={EMPTY} />);
    expect(container.querySelectorAll('.MuiSkeleton-root')).toHaveLength(3);
    expect(screen.queryByText(EMPTY)).not.toBeInTheDocument();
  });

  it('shows the empty message when there are no posts', () => {
    renderWithProviders(<PostList posts={[]} loading={false} emptyMessage={EMPTY} />);
    expect(screen.getByText(EMPTY)).toBeInTheDocument();
  });

  it('renders a card per post and wires like, share and delete to the shared actions', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <PostList
        posts={[post({ id: 'post-1', canDelete: true }), post({ id: 'post-2', body: 'Second' })]}
        loading={false}
        emptyMessage={EMPTY}
      />,
    );
    expect(screen.getByText('Second')).toBeInTheDocument();
    const likes = screen.getAllByRole('button', { name: 'Like' });
    expect(likes).toHaveLength(2);

    await user.click(likes[1]);
    await user.click(screen.getAllByRole('button', { name: 'Share' })[0]);
    await user.click(screen.getByRole('button', { name: 'Delete post' }));

    expect(actions.like).toHaveBeenCalledWith('post-2');
    expect(actions.share).toHaveBeenCalledWith('post-1');
    expect(actions.remove).toHaveBeenCalledWith('post-1');
  });

  it('offers no "load older" button at the end of the feed', () => {
    renderWithProviders(<PostList posts={[post()]} loading={false} emptyMessage={EMPTY} />);
    expect(screen.queryByRole('button', { name: 'Load older posts' })).not.toBeInTheDocument();
  });

  it('loads the next page on request', async () => {
    const user = userEvent.setup();
    const onLoadMore = vi.fn();
    renderWithProviders(
      <PostList posts={[post()]} loading={false} onLoadMore={onLoadMore} emptyMessage={EMPTY} />,
    );
    await user.click(screen.getByRole('button', { name: 'Load older posts' }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('disables the button while the next page is on its way', () => {
    renderWithProviders(
      <PostList
        posts={[post()]}
        loading={false}
        onLoadMore={vi.fn()}
        loadingMore
        emptyMessage={EMPTY}
      />,
    );
    expect(screen.getByRole('button', { name: 'Loading…' })).toBeDisabled();
  });
});
