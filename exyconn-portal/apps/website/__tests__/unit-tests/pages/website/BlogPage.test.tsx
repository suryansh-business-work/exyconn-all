import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListBlogPostsPagedDocument } from '@exyconn/shell/graphql/generated';
import { BlogPage } from '../../../../src/pages/website/BlogPage';
import { BLOG_COLUMNS } from '../../../../src/pages/website/blog-grid';
import { renderInSite, UrlProbe } from '../cms/cms-helpers';
import { dashboardProps, paged, statValues } from './content-dashboard-stub';
import { confirmRowDelete, pendingQuery, runRowAction } from './content-page-helpers';
import { blogRow } from './content-fixtures';

const gql = vi.hoisted(() => ({ list: vi.fn(), deletePost: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListBlogPostsQuery: () => gql.list(),
  useDeleteBlogPostMutation: () => [gql.deletePost],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('./content-dashboard-stub');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('@exyconn/shell/hooks/useSettings', () => ({
  useSettings: () => ({ formatDate: (value: string) => `on ${value}` }),
}));

vi.mock('../../../../src/pages/website/forms/blog-post', async () => ({
  BlogPostForm: (await import('./content-form-stub')).ContentFormStub,
}));

const renderPage = () =>
  renderInSite(
    <>
      <BlogPage />
      <UrlProbe />
    </>,
    { route: '/website/s/main/blog' },
  );

describe('BlogPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.deletePost.mockResolvedValue({ data: { deleteBlogPost: true } });
    gql.list.mockReturnValue({
      data: {
        listBlogPosts: [
          blogRow({ id: 'a', featured: true, tags: ['ai', 'graphql'] }),
          blogRow({ id: 'b', siteId: '', isActive: false, tags: ['ai'] }),
          blogRow({ id: 'c', siteId: 'site-2', featured: true, tags: ['other'] }),
        ],
      },
      loading: false,
    });
  });

  it('summarises only the posts of the current site, including unfiled ones on the default', () => {
    renderPage();

    expect(statValues()).toEqual({ Posts: '2', Featured: '1', Active: '1', Tags: '2' });
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('marks the tiles loading and counts nothing until the posts arrive', () => {
    gql.list.mockReturnValue(pendingQuery());
    renderPage();

    expect(dashboardProps().statsLoading).toBe(true);
    expect(statValues()).toEqual({ Posts: '0', Featured: '0', Active: '0', Tags: '0' });
  });

  it('drives the server grid with the paged posts query, scoped to the site', () => {
    renderPage();
    const page = { totalCount: 1, rows: [blogRow()] };

    expect(paged.document).toBe(ListBlogPostsPagedDocument);
    expect(paged.select?.({ listBlogPostsPaged: page } as never)).toBe(page);
    expect(paged.extraFilters).toEqual([{ field: 'siteId', op: 'EQUALS', value: 'site-1' }]);
    expect(dashboardProps().columnDefs).toBe(BLOG_COLUMNS);
    expect(dashboardProps()).toMatchObject({
      title: 'Blog',
      exportFileName: 'blog-posts',
      actionLabel: 'New post',
    });
    expect(dashboardProps().context.formatDate?.('2026-01-01')).toBe('on 2026-01-01');
  });

  it('opens the form blank for a new post and with the row for an edit', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(screen.getByText('Blank form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));
    expect(screen.queryByText('Blank form')).not.toBeInTheDocument();

    await runRowAction('edit', blogRow({ title: 'Edited post' }));
    expect(screen.getByText(/"title":"Edited post"/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(screen.queryByText(/Edited post/)).not.toBeInTheDocument();
  });

  it('opens a post in the live editor of the current site', async () => {
    renderPage();

    await runRowAction('liveEdit', blogRow({ id: 'post-7' }));

    expect(screen.getByLabelText('current url')).toHaveTextContent(
      '/website/s/main/blog/post-7/live-edit',
    );
  });

  it('deletes a post after confirming, by its id', async () => {
    renderPage();

    await confirmRowDelete(blogRow({ id: 'post-4' }), 'Delete blog post Scaling GraphQL?');

    expect(gql.deletePost).toHaveBeenCalledWith({ variables: { id: 'post-4' } });
    expect(await screen.findByText('Blog post deleted')).toBeInTheDocument();
  });
});
