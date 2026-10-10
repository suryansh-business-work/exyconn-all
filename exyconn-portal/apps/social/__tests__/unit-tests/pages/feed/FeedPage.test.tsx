import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SocialFeedQuery } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { FeedPage } from '../../../../src/pages/feed';
import { post } from '../../fixtures';

interface FetchMoreOptions {
  variables: { cursor?: string | null };
  updateQuery: (
    previous: SocialFeedQuery,
    options: { fetchMoreResult: SocialFeedQuery },
  ) => SocialFeedQuery;
}

interface FeedState {
  data?: SocialFeedQuery;
  loading: boolean;
  error?: Error;
  networkStatus: number;
}

const feed = vi.hoisted(() => {
  const state: FeedState = { loading: false, networkStatus: 7 };
  return {
    state,
    options: vi.fn<(options: unknown) => void>(),
    fetchMore: vi.fn<(options: FetchMoreOptions) => Promise<unknown>>(),
  };
});

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/shell/graphql/generated')>();
  return {
    ...actual,
    useSocialFeedQuery: (options: unknown) => {
      feed.options(options);
      return { ...feed.state, fetchMore: feed.fetchMore };
    },
    useCreateSocialPostMutation: () => [vi.fn()],
  };
});
vi.mock(
  '@exyconn/shell/hooks/useSettings',
  async () => (await import('../../settings.mock')).settingsMock,
);

const page = (posts: SocialFeedQuery['socialFeed']['posts'], nextCursor: string | null = null) => ({
  socialFeed: { __typename: 'SocialFeedPage' as const, nextCursor, posts },
});

beforeEach(() => {
  feed.state = { loading: false, networkStatus: 7 };
  feed.options.mockReset();
  feed.fetchMore.mockReset().mockResolvedValue({});
});

describe('FeedPage', () => {
  it('titles the page and puts the composer above the feed', () => {
    feed.state = { loading: false, networkStatus: 7, data: page([post()]) };
    renderWithProviders(<FeedPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Social' })).toBeInTheDocument();
    expect(screen.getByText('What the company is up to')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Post' })).toBeInTheDocument();
    expect(screen.getByText('Shipped the new payroll export today')).toBeInTheDocument();
    expect(feed.options).toHaveBeenCalledWith({ notifyOnNetworkStatusChange: true });
  });

  it('shows placeholders on the first load', () => {
    feed.state = { loading: true, networkStatus: 1 };
    const { container } = renderWithProviders(<FeedPage />);
    expect(container.querySelectorAll('.MuiSkeleton-root')).toHaveLength(3);
  });

  it('keeps the posts on screen while a refetch is loading', () => {
    feed.state = { loading: true, networkStatus: 4, data: page([post()]) };
    const { container } = renderWithProviders(<FeedPage />);
    expect(container.querySelectorAll('.MuiSkeleton-root')).toHaveLength(0);
    expect(screen.getByText('Shipped the new payroll export today')).toBeInTheDocument();
  });

  it('shows a failed feed as an error', () => {
    feed.state = { loading: false, networkStatus: 8, error: new Error('Feed unavailable') };
    renderWithProviders(<FeedPage />);
    expect(screen.getByText('Feed unavailable')).toBeInTheDocument();
  });

  it('invites the first post on an empty feed', () => {
    feed.state = { loading: false, networkStatus: 7, data: page([]) };
    renderWithProviders(<FeedPage />);
    expect(
      screen.getByText('Nothing here yet. Be the first to post something.'),
    ).toBeInTheDocument();
  });

  it('offers no older posts at the end of the feed', () => {
    feed.state = { loading: false, networkStatus: 7, data: page([post()], null) };
    renderWithProviders(<FeedPage />);
    expect(screen.queryByRole('button', { name: 'Load older posts' })).not.toBeInTheDocument();
  });

  it('fetches the next page from the cursor and appends it to the one on screen', async () => {
    const user = userEvent.setup();
    const first = post({ id: 'post-1' });
    feed.state = { loading: false, networkStatus: 7, data: page([first], 'cursor-2') };
    renderWithProviders(<FeedPage />);

    await user.click(screen.getByRole('button', { name: 'Load older posts' }));

    expect(feed.fetchMore).toHaveBeenCalledTimes(1);
    const options = feed.fetchMore.mock.calls[0][0];
    expect(options.variables).toEqual({ cursor: 'cursor-2' });

    const older = post({ id: 'post-0' });
    const merged = options.updateQuery(page([first], 'cursor-2'), {
      fetchMoreResult: page([older], 'cursor-3'),
    });
    expect(merged.socialFeed.posts.map((item) => item.id)).toEqual(['post-1', 'post-0']);
    expect(merged.socialFeed.nextCursor).toBe('cursor-3');
  });

  it('disables "load older" while the next page is on its way', () => {
    feed.state = { loading: true, networkStatus: 3, data: page([post()], 'cursor-2') };
    renderWithProviders(<FeedPage />);
    expect(screen.getByRole('button', { name: 'Loading…' })).toBeDisabled();
  });
});
