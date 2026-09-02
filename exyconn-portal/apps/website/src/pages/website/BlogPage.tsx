import { useCallback, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import {
  ServerDataGrid,
  type TablePageResult,
} from '@exyconn/shell/components/data/ServerDataGrid';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { ModuleDashboard } from '@exyconn/shell/components/dashboard/ModuleDashboard';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { useCrudDialog } from '@exyconn/shell/hooks/useCrudDialog';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useListBlogPostsQuery,
  useDeleteBlogPostMutation,
  ListBlogPostsPagedDocument,
  type ListBlogPostsPagedQuery,
  type ListBlogPostsPagedQueryVariables,
  type TableQueryInput,
} from '@exyconn/shell/graphql/generated';
import { BlogPostForm, type BlogRow } from './forms/blog-post';
import { BLOG_COLUMNS, type PagedBlogRow, type BlogGridContext } from './blog-grid';

/** Website CMS — blog posts with a server-side grid. */
export function BlogPage() {
  // Stat cards still summarise all posts; the grid itself is server-paged.
  const { data } = useListBlogPostsQuery();
  const [deleteBlogPost] = useDeleteBlogPostMutation();
  const dialog = useCrudDialog<BlogRow>();
  const confirm = useConfirm();
  const notify = useNotify();
  const { formatDate } = useSettings();
  const client = useApolloClient();
  const [refreshSignal, setRefreshSignal] = useState(0);

  const rows = data?.listBlogPosts ?? [];
  const tagCount = new Set(rows.flatMap((r) => r.tags)).size;
  const stats: StatItem[] = [
    { label: 'Posts', value: String(rows.length), accent: '#4f8cff' },
    { label: 'Featured', value: String(rows.filter((r) => r.featured).length), accent: '#f9851f' },
    { label: 'Active', value: String(rows.filter((r) => r.isActive).length), accent: '#7be37b' },
    { label: 'Tags', value: String(tagCount), accent: '#b58cff' },
  ];

  const reload = () => setRefreshSignal((n) => n + 1);

  const fetchRows = useCallback(
    async (input: TableQueryInput): Promise<TablePageResult<PagedBlogRow>> => {
      const result = await client.query<ListBlogPostsPagedQuery, ListBlogPostsPagedQueryVariables>({
        query: ListBlogPostsPagedDocument,
        variables: { input },
        fetchPolicy: 'network-only',
      });
      return {
        rows: result.data.listBlogPostsPaged.rows,
        totalCount: result.data.listBlogPostsPaged.totalCount,
      };
    },
    [client],
  );

  const handleDelete = async (row: PagedBlogRow) => {
    const ok = await confirm({ message: `Delete blog post ${row.title}?`, confirmText: 'Delete' });
    if (!ok) {
      return;
    }
    await deleteBlogPost({ variables: { id: row.id } });
    reload();
    notify('Blog post deleted');
  };

  const gridContext: BlogGridContext = {
    onEdit: dialog.openEdit,
    onDelete: handleDelete,
    formatDate,
  };

  return (
    <ModuleDashboard
      title="Blog"
      subtitle="Website blog posts"
      actionLabel="New post"
      onAction={dialog.openCreate}
      stats={stats}
      dialog={
        <CrudDialog
          open={dialog.open}
          title={dialog.editing ? 'Edit blog post' : 'New blog post'}
          onClose={dialog.close}
        >
          <BlogPostForm
            initial={dialog.editing}
            onCancel={dialog.close}
            onDone={() => {
              reload();
              dialog.close();
            }}
          />
        </CrudDialog>
      }
    >
      <ServerDataGrid<PagedBlogRow>
        columnDefs={BLOG_COLUMNS}
        fetchRows={fetchRows}
        context={gridContext}
        refreshSignal={refreshSignal}
        searchPlaceholder="Search blog posts…"
      />
    </ModuleDashboard>
  );
}
