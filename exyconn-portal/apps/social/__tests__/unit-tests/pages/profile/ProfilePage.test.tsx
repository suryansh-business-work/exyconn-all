import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SocialProfileQuery, SocialUserPostsQuery } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { ProfilePage } from '../../../../src/pages/profile';
import { post, profile } from '../../fixtures';

interface FetchMoreOptions {
  variables: { cursor?: string | null };
  updateQuery: (
    previous: SocialUserPostsQuery,
    options: { fetchMoreResult: SocialUserPostsQuery },
  ) => SocialUserPostsQuery;
}

interface QueryState<T> {
  data?: T;
  loading: boolean;
  error?: Error;
  networkStatus?: number;
}

const api = vi.hoisted(() => ({
  user: { id: 'user-1' } as { id: string } | null,
  profile: { loading: false } as QueryState<SocialProfileQuery>,
  posts: { loading: false, networkStatus: 7 } as QueryState<SocialUserPostsQuery>,
  profileOptions: vi.fn<(options: unknown) => void>(),
  postsOptions: vi.fn<(options: unknown) => void>(),
  fetchMore: vi.fn<(options: FetchMoreOptions) => Promise<unknown>>(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/shell/graphql/generated')>();
  return {
    ...actual,
    useSocialProfileQuery: (options: unknown) => {
      api.profileOptions(options);
      return api.profile;
    },
    useSocialUserPostsQuery: (options: unknown) => {
      api.postsOptions(options);
      return { ...api.posts, fetchMore: api.fetchMore };
    },
  };
});
vi.mock('@exyconn/shell/auth/AuthContext', () => ({ useAuth: () => ({ user: api.user }) }));
vi.mock('../../../../src/hooks/useSocialActions', () => ({
  useSocialActions: () => ({ like: vi.fn(), share: vi.fn(), remove: vi.fn() }),
}));
vi.mock(
  '@exyconn/shell/hooks/useSettings',
  async () => (await import('../../settings.mock')).settingsMock,
);

const PATH = '/social/people/:userId';
const page = (
  posts: SocialUserPostsQuery['socialUserPosts']['posts'],
  nextCursor: string | null = null,
) => ({
  socialUserPosts: { __typename: 'SocialFeedPage' as const, nextCursor, posts },
});

beforeEach(() => {
  api.user = { id: 'user-1' };
  api.profile = { loading: false, data: { socialProfile: profile() } };
  api.posts = { loading: false, networkStatus: 7, data: page([]) };
  api.profileOptions.mockReset();
  api.postsOptions.mockReset();
  api.fetchMore.mockReset().mockResolvedValue({});
});

describe('ProfilePage', () => {
  it('shows your own profile on /social/me and talks to you about your posts', () => {
    renderWithProviders(<ProfilePage />, { route: '/social/me', path: '/social/me' });
    expect(api.profileOptions).toHaveBeenCalledWith({
      variables: { userId: 'user-1' },
      skip: false,
    });
    expect(api.postsOptions).toHaveBeenCalledWith({
      variables: { userId: 'user-1' },
      skip: false,
      notifyOnNetworkStatusChange: true,
    });
    expect(screen.getByRole('heading', { name: 'Asha Rao' })).toBeInTheDocument();
    expect(screen.getByText('Posts')).toBeInTheDocument();
    expect(screen.getByText('You have not posted anything yet.')).toBeInTheDocument();
  });

  it('shows a colleague named in the URL and talks about them', () => {
    renderWithProviders(<ProfilePage />, { route: '/social/people/user-2', path: PATH });
    expect(api.profileOptions).toHaveBeenCalledWith({
      variables: { userId: 'user-2' },
      skip: false,
    });
    expect(screen.getByText('Nothing posted yet.')).toBeInTheDocument();
  });

  it('treats your own id in the URL as your own profile', () => {
    renderWithProviders(<ProfilePage />, { route: '/social/people/user-1', path: PATH });
    expect(screen.getByText('You have not posted anything yet.')).toBeInTheDocument();
  });

  it('skips both queries when nobody is signed in and no one is named', () => {
    api.user = null;
    api.profile = { loading: false };
    api.posts = { loading: false, networkStatus: 7 };
    renderWithProviders(<ProfilePage />, { route: '/social/me', path: '/social/me' });
    expect(api.profileOptions).toHaveBeenCalledWith({ variables: { userId: '' }, skip: true });
    expect(screen.getByText('Nothing posted yet.')).toBeInTheDocument();
  });

  it('shows only the error when the profile cannot be loaded', () => {
    api.profile = { loading: false, error: new Error('No such colleague') };
    renderWithProviders(<ProfilePage />, { route: '/social/people/user-2', path: PATH });
    expect(screen.getByRole('alert')).toHaveTextContent('No such colleague');
    expect(screen.queryByText('Posts')).not.toBeInTheDocument();
  });

  it('shows placeholders for the header and the first page of posts', () => {
    api.profile = { loading: true };
    api.posts = { loading: true, networkStatus: 1 };
    const { container } = renderWithProviders(<ProfilePage />, {
      route: '/social/people/user-2',
      path: PATH,
    });
    expect(container.querySelectorAll('.MuiSkeleton-root')).toHaveLength(4);
  });

  it('shows a failed list of posts as an error under the header', () => {
    api.posts = { loading: false, networkStatus: 8, error: new Error('Posts unavailable') };
    renderWithProviders(<ProfilePage />, { route: '/social/people/user-2', path: PATH });
    expect(screen.getByRole('heading', { name: 'Asha Rao' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Posts unavailable');
  });

  it('fetches older posts from the cursor and appends them', async () => {
    const user = userEvent.setup();
    const first = post({ id: 'post-1' });
    api.posts = { loading: false, networkStatus: 7, data: page([first], 'cursor-2') };
    renderWithProviders(<ProfilePage />, { route: '/social/people/user-2', path: PATH });

    await user.click(screen.getByRole('button', { name: 'Load older posts' }));

    const options = api.fetchMore.mock.calls[0][0];
    expect(options.variables).toEqual({ cursor: 'cursor-2' });
    const merged = options.updateQuery(page([first], 'cursor-2'), {
      fetchMoreResult: page([post({ id: 'post-0' })], null),
    });
    expect(merged.socialUserPosts.posts.map((item) => item.id)).toEqual(['post-1', 'post-0']);
    expect(merged.socialUserPosts.nextCursor).toBeNull();
  });

  it('offers no older posts without a cursor, and disables the button while one loads', () => {
    api.posts = { loading: false, networkStatus: 7, data: page([post()]) };
    const { unmount } = renderWithProviders(<ProfilePage />, {
      route: '/social/people/user-2',
      path: PATH,
    });
    expect(screen.queryByRole('button', { name: 'Load older posts' })).not.toBeInTheDocument();
    unmount();

    api.posts = { loading: true, networkStatus: 3, data: page([post()], 'cursor-2') };
    renderWithProviders(<ProfilePage />, { route: '/social/people/user-2', path: PATH });
    expect(screen.getByRole('button', { name: 'Loading…' })).toBeDisabled();
  });
});
