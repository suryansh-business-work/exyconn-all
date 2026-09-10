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
import { KbArticleForm, type KbArticleRow } from './forms/kb-article';
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
    confirmMessage: (row) => `Delete "${row.title}"? Any link to /${row.slug} will stop working.`,
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListKbArticlesPagedDocument,
    (data: ListKbArticlesPagedQuery) => data.listKbArticlesPaged,
  );

  const stats = statsData?.listKbArticlesStats;
  const statItems: StatItem[] = [
    { label: 'Articles', value: String(statTotal(stats)), accent: '#4f8cff' },
    {
      label: 'Published',
      value: String(statCount(stats, 'isPublished', 'true')),
      accent: '#22c55e',
    },
    { label: 'Drafts', value: String(statCount(stats, 'isPublished', 'false')), accent: '#f59e0b' },
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
