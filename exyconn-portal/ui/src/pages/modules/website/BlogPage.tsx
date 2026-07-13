import { DataTable, type Column } from '../../../components/data/DataTable';
import { BoolChip } from '../../../components/data/BoolChip';
import { CrudDialog } from '../../../components/data/CrudDialog';
import { ModuleDashboard } from '../../../components/dashboard/ModuleDashboard';
import type { StatItem } from '../../../components/dashboard/StatCard';
import { useCrudDialog } from '../../../hooks/useCrudDialog';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useNotify } from '../../../components/feedback/NotificationProvider';
import { useSettings } from '../../../hooks/useSettings';
import { useListBlogPostsQuery, useDeleteBlogPostMutation } from '../../../graphql/generated';
import { BlogPostForm, type BlogRow } from './forms/blog-post';

/** Website CMS — blog posts. */
export function BlogPage() {
  const { data, loading, refetch } = useListBlogPostsQuery();
  const [deleteBlogPost] = useDeleteBlogPostMutation();
  const dialog = useCrudDialog<BlogRow>();
  const confirm = useConfirm();
  const notify = useNotify();
  const { formatDate } = useSettings();

  const rows = data?.listBlogPosts ?? [];
  const tagCount = new Set(rows.flatMap((r) => r.tags)).size;
  const stats: StatItem[] = [
    { label: 'Posts', value: String(rows.length), accent: '#4f8cff' },
    { label: 'Featured', value: String(rows.filter((r) => r.featured).length), accent: '#f9851f' },
    { label: 'Active', value: String(rows.filter((r) => r.isActive).length), accent: '#7be37b' },
    { label: 'Tags', value: String(tagCount), accent: '#b58cff' },
  ];

  const columns: Column<BlogRow>[] = [
    { key: 'title', label: 'Title' },
    { key: 'slug', label: 'Slug' },
    { key: 'author', label: 'Author', render: (r) => r.author.name },
    { key: 'tags', label: 'Tags', render: (r) => r.tags.join(', ') },
    { key: 'featured', label: 'Featured', render: (r) => <BoolChip value={r.featured} /> },
    { key: 'publishedAt', label: 'Published', render: (r) => formatDate(r.publishedAt) },
  ];

  const handleDelete = async (row: BlogRow) => {
    const ok = await confirm({ message: `Delete blog post ${row.title}?`, confirmText: 'Delete' });
    if (!ok) return;
    await deleteBlogPost({ variables: { id: row.id } });
    await refetch();
    notify('Blog post deleted');
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
              void refetch();
              dialog.close();
            }}
          />
        </CrudDialog>
      }
    >
      <DataTable
        columns={columns}
        rows={rows}
        onEdit={dialog.openEdit}
        onDelete={handleDelete}
        emptyMessage={loading ? 'Loading…' : 'No blog posts yet.'}
      />
    </ModuleDashboard>
  );
}
