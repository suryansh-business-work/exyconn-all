import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import type { SocialPostQuery } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { PostPage } from '../../../../src/pages/post';
import { post } from '../../fixtures';

interface PostState {
  data?: SocialPostQuery;
  loading: boolean;
  error?: Error;
}

const api = vi.hoisted(() => ({
  state: { loading: false } as PostState,
  queryOptions: vi.fn<(options: unknown) => void>(),
  like: vi.fn<(id: string) => Promise<void>>(),
  share: vi.fn<(id: string) => Promise<void>>(),
  remove: vi.fn<(id: string) => Promise<boolean>>(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/shell/graphql/generated')>();
  return {
    ...actual,
    useSocialPostQuery: (options: unknown) => {
      api.queryOptions(options);
      return api.state;
    },
  };
});
vi.mock('../../../../src/hooks/useSocialActions', () => ({
  useSocialActions: () => ({ like: api.like, share: api.share, remove: api.remove }),
}));
vi.mock('../../../../src/pages/post/CommentThread', () => ({
  CommentThread: ({ postId }: Readonly<{ postId: string }>) => <p>Thread for {postId}</p>,
}));
vi.mock('../../../../src/pages/post/forms/comment', () => ({
  CommentForm: ({ postId }: Readonly<{ postId: string }>) => <p>Reply box for {postId}</p>,
}));
vi.mock(
  '@exyconn/shell/hooks/useSettings',
  async () => (await import('../../settings.mock')).settingsMock,
);

function renderPage(route = '/social/posts/post-1') {
  return renderWithProviders(
    <Routes>
      <Route path="/social/posts/:id" element={<PostPage />} />
      <Route path="/social/posts" element={<PostPage />} />
      <Route path="/social" element={<p>The feed</p>} />
    </Routes>,
    { route },
  );
}

beforeEach(() => {
  api.state = { loading: false };
  api.queryOptions.mockReset();
  api.like.mockReset().mockResolvedValue(undefined);
  api.share.mockReset().mockResolvedValue(undefined);
  api.remove.mockReset().mockResolvedValue(true);
});

describe('PostPage', () => {
  it('loads the post named in the URL', () => {
    renderPage();
    expect(api.queryOptions).toHaveBeenCalledWith({ variables: { id: 'post-1' } });
  });

  it('asks for an empty id when the URL names no post', () => {
    renderPage('/social/posts');
    expect(api.queryOptions).toHaveBeenCalledWith({ variables: { id: '' } });
  });

  it('goes back to the feed from the back button', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Back to the feed' }));
    expect(await screen.findByText('The feed')).toBeInTheDocument();
  });

  it('shows a placeholder while the post loads', () => {
    api.state = { loading: true };
    const { container } = renderPage();
    expect(container.querySelectorAll('.MuiSkeleton-root')).toHaveLength(1);
    expect(screen.queryByText('Comments')).not.toBeInTheDocument();
  });

  it('shows a failed load as an error', () => {
    api.state = { loading: false, error: new Error('Post not found') };
    renderPage();
    expect(screen.getByRole('alert')).toHaveTextContent('Post not found');
  });

  it('shows the post with its thread and reply box', () => {
    api.state = { loading: false, data: { socialPost: post() } };
    renderPage();
    expect(screen.getByText('Shipped the new payroll export today')).toBeInTheDocument();
    expect(screen.getByText('Comments')).toBeInTheDocument();
    expect(screen.getByText('Thread for post-1')).toBeInTheDocument();
    expect(screen.getByText('Reply box for post-1')).toBeInTheDocument();
  });

  it('likes and shares through the shared actions', async () => {
    const user = userEvent.setup();
    api.state = { loading: false, data: { socialPost: post() } };
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Like' }));
    await user.click(screen.getByRole('button', { name: 'Share' }));
    expect(api.like).toHaveBeenCalledWith('post-1');
    expect(api.share).toHaveBeenCalledWith('post-1');
  });

  it('returns to the feed once the post is deleted', async () => {
    const user = userEvent.setup();
    api.state = { loading: false, data: { socialPost: post({ canDelete: true }) } };
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Delete post' }));
    expect(api.remove).toHaveBeenCalledWith('post-1');
    expect(await screen.findByText('The feed')).toBeInTheDocument();
  });

  it('stays on the post when the delete did not happen', async () => {
    api.remove.mockResolvedValue(false);
    const user = userEvent.setup();
    api.state = { loading: false, data: { socialPost: post({ canDelete: true }) } };
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Delete post' }));
    expect(api.remove).toHaveBeenCalledWith('post-1');
    expect(screen.queryByText('The feed')).not.toBeInTheDocument();
    expect(screen.getByText('Thread for post-1')).toBeInTheDocument();
  });
});
