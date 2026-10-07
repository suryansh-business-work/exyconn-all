import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { PostsTab } from '../../../../src/pages/social/PostsTab';
import { renderWithProviders } from '../../test-utils';
import { chooseOption, optionsOf } from '../../form-helpers';
import { ACCOUNTS, POSTS, RULES } from './posts-tab.fixtures';

const tab = vi.hoisted(() => ({
  posts: vi.fn(),
  accounts: vi.fn(),
  rules: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSocialMediaPostsQuery: (options: unknown) => tab.posts(options),
  useSocialAccountsQuery: () => tab.accounts(),
  useSocialNetworkRulesQuery: () => tab.rules(),
}));
vi.mock('../../../../src/pages/social/usePostActions', () => ({
  usePostActions: () => ({ publishNow: vi.fn(), deletePost: vi.fn() }),
}));
vi.mock('../../../../src/pages/social/forms/social-post', async () => ({
  SocialPostForm: (await import('./composer-stub')).ComposerStub,
}));
vi.mock('@exyconn/shell/logging/portalLogger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/logging/portalLogger')>()),
  portalLogger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

/** The variables of the latest posts query the tab ran. */
const lastQuery = () => tab.posts.mock.calls.at(-1)?.[0];

async function editFailedPost() {
  const row = screen.getByText('LinkedIn token expired').closest('tr') as HTMLElement;
  await userEvent.click(within(row).getByRole('button', { name: 'edit post' }));
}

describe('PostsTab filters and editing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tab.refetch.mockResolvedValue({});
    tab.posts.mockReturnValue({
      data: { socialMediaPosts: POSTS },
      loading: false,
      refetch: tab.refetch,
    });
    tab.accounts.mockReturnValue({ data: { socialAccounts: ACCOUNTS }, loading: false });
    tab.rules.mockReturnValue({ data: { socialNetworkRules: RULES }, loading: false });
  });

  it('asks for up to 200 posts on every account, in any status, at first', () => {
    renderWithProviders(<PostsTab />);

    expect(lastQuery()).toEqual({
      variables: { accountId: null, status: null, limit: 200 },
      fetchPolicy: 'cache-and-network',
    });
  });

  it('offers every connected account and every status as a filter', async () => {
    renderWithProviders(<PostsTab />);

    expect(await optionsOf('Account')).toEqual([
      'All accounts',
      'Acme · Facebook',
      'Acme · LinkedIn',
    ]);
    expect(await optionsOf('Status')).toEqual([
      'Any status',
      'DRAFT',
      'FAILED',
      'PUBLISHED',
      'PUBLISHING',
      'SCHEDULED',
    ]);
  });

  it('narrows the posts to one account and one status, and back to all', async () => {
    renderWithProviders(<PostsTab />);

    await chooseOption('Account', 'Acme · LinkedIn');
    await chooseOption('Status', 'FAILED');
    expect(lastQuery().variables).toEqual({ accountId: 'li-1', status: 'FAILED', limit: 200 });

    await chooseOption('Account', 'All accounts');
    await chooseOption('Status', 'Any status');
    expect(lastQuery().variables).toEqual({ accountId: null, status: null, limit: 200 });
  });

  it('edits an unsent post in a drawer and closes it on cancel', async () => {
    renderWithProviders(<PostsTab />);

    await editFailedPost();
    expect(await screen.findByText('1 accounts, 1 rules, edit p-failed')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Edit post' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));
    await waitFor(() => expect(screen.queryByText(/edit p-failed/)).not.toBeInTheDocument());
    expect(tab.refetch).not.toHaveBeenCalled();
  });

  it('closes the drawer from its own close button', async () => {
    renderWithProviders(<PostsTab />);

    await editFailedPost();
    await userEvent.click(await screen.findByRole('button', { name: 'Close' }));

    await waitFor(() => expect(screen.queryByText(/edit p-failed/)).not.toBeInTheDocument());
  });

  it('closes the drawer and reloads the posts once the edit is saved', async () => {
    renderWithProviders(<PostsTab />);

    await editFailedPost();
    await userEvent.click(await screen.findByRole('button', { name: 'Finish form' }));

    await waitFor(() => expect(screen.queryByText(/edit p-failed/)).not.toBeInTheDocument());
    expect(tab.refetch).toHaveBeenCalledTimes(1);
  });

  it('logs a reload that fails after an edit', async () => {
    const failure = new Error('offline');
    tab.refetch.mockRejectedValue(failure);
    renderWithProviders(<PostsTab />);

    await editFailedPost();
    await userEvent.click(await screen.findByRole('button', { name: 'Finish form' }));

    await waitFor(() =>
      expect(portalLogger.warn).toHaveBeenCalledWith('Could not reload posts', failure),
    );
  });
});
