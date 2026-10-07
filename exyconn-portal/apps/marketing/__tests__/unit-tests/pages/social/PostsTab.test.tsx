import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEFAULT_FORMAT_SETTINGS, formatDateTime } from '@exyconn/i18n';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { PostsTab } from '../../../../src/pages/social/PostsTab';
import { renderWithProviders } from '../../test-utils';
import { ACCOUNTS, POSTS, RULES } from './posts-tab.fixtures';

const tab = vi.hoisted(() => ({
  posts: vi.fn(),
  accounts: vi.fn(),
  rules: vi.fn(),
  refetch: vi.fn(),
  publishNow: vi.fn(),
  deletePost: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSocialMediaPostsQuery: (options: unknown) => tab.posts(options),
  useSocialAccountsQuery: () => tab.accounts(),
  useSocialNetworkRulesQuery: () => tab.rules(),
}));
vi.mock('../../../../src/pages/social/usePostActions', () => ({
  usePostActions: () => ({ publishNow: tab.publishNow, deletePost: tab.deletePost }),
}));
vi.mock('../../../../src/pages/social/forms/social-post', async () => ({
  SocialPostForm: (await import('./composer-stub')).ComposerStub,
}));
vi.mock('@exyconn/shell/logging/portalLogger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/logging/portalLogger')>()),
  portalLogger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const rowOf = (text: string) => within(screen.getByText(text).closest('tr') as HTMLElement);
const actionsIn = (text: string) =>
  rowOf(text)
    .queryAllByRole('button')
    .map((button) => button.getAttribute('aria-label'));

describe('PostsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tab.refetch.mockResolvedValue({});
    tab.publishNow.mockResolvedValue(undefined);
    tab.deletePost.mockResolvedValue(undefined);
    tab.posts.mockReturnValue({
      data: { socialMediaPosts: POSTS },
      loading: false,
      refetch: tab.refetch,
    });
    tab.accounts.mockReturnValue({ data: { socialAccounts: ACCOUNTS }, loading: false });
    tab.rules.mockReturnValue({ data: { socialNetworkRules: RULES }, loading: false });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists each post on its account with an excerpt, the time and what it did', () => {
    renderWithProviders(<PostsTab />);
    const scheduled = rowOf(`${'x'.repeat(90)}…`);

    expect(scheduled.getByText('Acme · Facebook')).toBeInTheDocument();
    expect(scheduled.getByText('SCHEDULED')).toBeInTheDocument();
    expect(
      scheduled.getByText(formatDateTime(POSTS[0].scheduledAt, DEFAULT_FORMAT_SETTINGS)),
    ).toBeInTheDocument();
    expect(scheduled.getByText('90')).toBeInTheDocument();
  });

  it('shows why a post failed, and a dash for a post with no text', () => {
    renderWithProviders(<PostsTab />);
    const failed = rowOf('LinkedIn token expired');

    expect(failed.getByText('Acme · LinkedIn')).toBeInTheDocument();
    expect(failed.getByText('—')).toBeInTheDocument();
    expect(failed.getByText('Not scheduled')).toBeInTheDocument();
  });

  it('names a post on a disconnected account by its network, timed when it went out', () => {
    renderWithProviders(<PostsTab />);
    const published = rowOf('Launch day');

    expect(published.getByText('INSTAGRAM')).toBeInTheDocument();
    expect(
      published.getByText(formatDateTime(POSTS[2].publishedAt, DEFAULT_FORMAT_SETTINGS)),
    ).toBeInTheDocument();
  });

  it('offers edit, publish and delete only on posts that have not gone out', () => {
    renderWithProviders(<PostsTab />);

    expect(actionsIn('LinkedIn token expired')).toEqual([
      'edit post',
      'publish post now',
      'delete post',
    ]);
    expect(actionsIn('Launch day')).toEqual(['open post on the network']);
  });

  it('opens a published post on its network in a new tab', async () => {
    const open = vi.fn();
    vi.stubGlobal('open', open);
    renderWithProviders(<PostsTab />);

    await userEvent.click(
      rowOf('Launch day').getByRole('button', { name: 'open post on the network' }),
    );

    expect(open).toHaveBeenCalledWith('https://instagram.example/p/1', '_blank', 'noopener');
  });

  it('publishes or deletes the post of a row', async () => {
    renderWithProviders(<PostsTab />);
    const failed = rowOf('LinkedIn token expired');

    await userEvent.click(failed.getByRole('button', { name: 'publish post now' }));
    await userEvent.click(failed.getByRole('button', { name: 'delete post' }));

    expect(tab.publishNow).toHaveBeenCalledWith(POSTS[1]);
    expect(tab.deletePost).toHaveBeenCalledWith(POSTS[1]);
  });

  it('logs a post action that throws', async () => {
    const failure = new Error('offline');
    tab.publishNow.mockRejectedValue(failure);
    renderWithProviders(<PostsTab />);

    await userEvent.click(
      rowOf('LinkedIn token expired').getByRole('button', { name: 'publish post now' }),
    );

    await waitFor(() =>
      expect(portalLogger.error).toHaveBeenCalledWith('A post action failed', failure),
    );
  });

  it('says how to get the first post while there are none', () => {
    tab.posts.mockReturnValue({ data: undefined, loading: false, refetch: tab.refetch });
    renderWithProviders(<PostsTab />);

    expect(
      screen.getByText('No posts yet. Sync an account, or write one in Compose.'),
    ).toBeInTheDocument();
  });
});
