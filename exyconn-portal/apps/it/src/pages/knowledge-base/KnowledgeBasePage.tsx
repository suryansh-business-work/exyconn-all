import type { ColDef } from 'ag-grid-community';
import {
  CrudDashboard,
  actionsColumn,
  boolColumn,
  dateColumn,
  textColumn,
  useCrudResource,
  usePagedFetcher,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount } from '@exyconn/shell/components/data/tableStats';
import { color } from '@exyconn/shell/components/ui';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { KbArticleForm, type KbArticleRow } from '@exyconn/shell/pages/content-forms';
import {
  FilterOp,
  ListKbArticlesPagedDocument,
  SupportCategory,
  useDeleteKbArticleMutation,
  useListKbArticlesStatsQuery,
  type ListKbArticlesPagedQuery,
} from '@exyconn/shell/graphql/generated';

type PagedArticleRow = ListKbArticlesPagedQuery['listKbArticlesPaged']['rows'][number];

/** IT writes IT articles only; the server holds IT staff to the same rule. */
const IT_CATEGORIES = [SupportCategory.It];
const IT_ONLY = [{ field: 'category', op: FilterOp.Equals, value: SupportCategory.It }];

const COLUMNS: ColDef<PagedArticleRow>[] = [
  textColumn('title', 'Title'),
  textColumn('slug', 'Slug'),
  boolColumn('isPublished', 'Published'),
  dateColumn('updatedAt', 'Updated'),
  actionsColumn(),
];

/**
 * IT › Knowledge Base: guides, troubleshooting steps, SOPs and FAQs. The same articles the
 * helpdesk searches when answering and employees search before raising a ticket.
 */
export function KnowledgeBasePage() {
  const { formatDate } = useSettings();
  const { data: statsData, refetch: refetchStats } = useListKbArticlesStatsQuery();
  const [remove] = useDeleteKbArticleMutation();
  const crud = useCrudResource<KbArticleRow, PagedArticleRow>({
    label: 'Article',
    onDelete: (row) => remove({ variables: { id: row.id } }),
    confirmMessage: (row) => ({ message: 'Delete "{title}"?', values: { title: row.title } }),
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListKbArticlesPagedDocument,
    (data: ListKbArticlesPagedQuery) => data.listKbArticlesPaged,
    IT_ONLY,
  );

  const statItems: StatItem[] = [
    {
      label: 'IT articles',
      value: String(statCount(statsData?.listKbArticlesStats, 'category', SupportCategory.It)),
      accent: color.cyan[600],
    },
  ];
  const gridContext: DatedCrudGridContext<PagedArticleRow> = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Knowledge Base"
      subtitle="IT guides, troubleshooting, SOPs and FAQs"
      entityLabel="article"
      exportFileName="it-knowledge-base"
      permissionModule="KbArticle"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <KbArticleForm
          initial={initial}
          categories={IT_CATEGORIES}
          onCancel={crud.close}
          onDone={crud.onDone}
        />
      )}
      columnDefs={COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search articles…"
    />
  );
}
