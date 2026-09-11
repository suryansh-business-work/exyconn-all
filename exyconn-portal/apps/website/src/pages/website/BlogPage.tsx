import { useNavigate } from 'react-router-dom';
import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useListBlogPostsQuery,
  useDeleteBlogPostMutation,
  ListBlogPostsPagedDocument,
  type ListBlogPostsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { BlogPostForm, type BlogRow } from './forms/blog-post';
import { BLOG_COLUMNS, type PagedBlogRow, type BlogGridContext } from './blog-grid';
import { color } from '@exyconn/shell/components/ui';

/** Website CMS — blog posts with a server-side grid. */
export function BlogPage() {
  // Stat cards still summarise all posts; the grid itself is server-paged.
  const { data } = useListBlogPostsQuery();
  const [deleteBlogPost] = useDeleteBlogPostMutation();
  const { formatDate } = useSettings();
  const navigate = useNavigate();
  const crud = useCrudResource<BlogRow, PagedBlogRow>({
    label: 'Blog post',
    onDelete: (row) => deleteBlogPost({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete blog post ${row.title}?`,
  });
  const fetchRows = usePagedFetcher(
    ListBlogPostsPagedDocument,
    (result: ListBlogPostsPagedQuery) => result.listBlogPostsPaged,
  );

  const rows = data?.listBlogPosts ?? [];
  const tagCount = new Set(rows.flatMap((r) => r.tags)).size;
  const stats: StatItem[] = [
    { label: 'Posts', value: String(rows.length), accent: color.blue[400] },
    {
      label: 'Featured',
      value: String(rows.filter((r) => r.featured).length),
      accent: color.orange[500],
    },
    {
      label: 'Active',
      value: String(rows.filter((r) => r.isActive).length),
      accent: color.green[300],
    },
    { label: 'Tags', value: String(tagCount), accent: color.violet[200] },
  ];

  const gridContext: BlogGridContext = {
    actions: {
      edit: crud.openEdit,
      liveEdit: (row) => navigate(`/website/blog/${row.id}/live-edit`),
      delete: crud.remove,
    },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Blog"
      subtitle="Website blog posts"
      entityLabel="blog post"
      actionLabel="New post"
      stats={stats}
      crud={crud}
      renderForm={(initial) => (
        <BlogPostForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={BLOG_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search blog posts…"
    />
  );
}
