import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useListKbArticlesStatsQuery,
  useDeleteKbArticleMutation,
  ListKbArticlesPagedDocument,
  type ListKbArticlesPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { KbArticleForm, type KbArticleRow } from '@exyconn/shell/pages/content-forms';
import { color } from '@exyconn/shell/components/ui';
import {
  KB_ARTICLE_COLUMNS,
  type PagedKbArticleRow,
  type KbArticlesGridContext,
} from './kb-articles-grid';

/**
 * Support → Knowledge Base: the answers written once so they are not typed again.
 *
 * Search reaches every signed-in colleague, not just the desk — an agent hunting for the
 * answer to paste and an employee hunting for it themselves are the same search.
 */
export function KnowledgeBasePage() {
  const { data: statsData, refetch: refetchStats } = useListKbArticlesStatsQuery();
  const [deleteArticle] = useDeleteKbArticleMutation();
  const { formatDate } = useSettings();

  const crud = useCrudResource<KbArticleRow, PagedKbArticleRow>({
    label: 'Article',
    onDelete: (row) => deleteArticle({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message: 'Delete "{title}"? Any link to /{slug} will stop working.',
      values: { title: row.title, slug: row.slug },
    }),
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListKbArticlesPagedDocument,
    (data: ListKbArticlesPagedQuery) => data.listKbArticlesPaged,
  );

  const stats = statsData?.listKbArticlesStats;
  const statItems: StatItem[] = [
    { label: 'Articles', value: String(statTotal(stats)), accent: color.blue[400] },
    {
      label: 'Published',
      value: String(statCount(stats, 'isPublished', 'true')),
      accent: color.green[500],
    },
    {
      label: 'Drafts',
      value: String(statCount(stats, 'isPublished', 'false')),
      accent: color.amber[500],
    },
  ];

  const gridContext: KbArticlesGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Knowledge base"
      subtitle="Answers written once, so the desk does not type them twice"
      entityLabel="article"
      exportFileName="knowledge-base"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <KbArticleForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      permissionModule="KbArticle"
      columnDefs={KB_ARTICLE_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by title, slug or summary…"
    />
  );
}
