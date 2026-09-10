import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import {
  useListCannedRepliesStatsQuery,
  useDeleteCannedReplyMutation,
  ListCannedRepliesPagedDocument,
  type ListCannedRepliesPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { CannedReplyForm, type CannedReplyRow } from './forms/canned-reply';
import { color } from '@exyconn/shell/components/ui';
import {
  CANNED_REPLY_COLUMNS,
  type PagedCannedReplyRow,
  type CannedRepliesGridContext,
} from './canned-replies-grid';

/** Support → Canned Replies: the paragraphs the desk sends often, kept once. */
export function CannedRepliesPage() {
  const { data: statsData, refetch: refetchStats } = useListCannedRepliesStatsQuery();
  const [deleteReply] = useDeleteCannedReplyMutation();

  const crud = useCrudResource<CannedReplyRow, PagedCannedReplyRow>({
    label: 'Canned reply',
    onDelete: (row) => deleteReply({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete "${row.title}"?`,
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListCannedRepliesPagedDocument,
    (data: ListCannedRepliesPagedQuery) => data.listCannedRepliesPaged,
  );

  const stats = statsData?.listCannedRepliesStats;
  const statItems: StatItem[] = [
    { label: 'Snippets', value: String(statTotal(stats)), accent: color.blue[400] },
    {
      label: 'Offered',
      value: String(statCount(stats, 'isActive', 'true')),
      accent: color.green[500],
    },
    {
      label: 'Retired',
      value: String(statCount(stats, 'isActive', 'false')),
      accent: color.slate[400],
    },
  ];

  const gridContext: CannedRepliesGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
  };

  return (
    <CrudDashboard
      title="Canned replies"
      subtitle="The paragraphs the desk sends often — a starting point, never a send"
      entityLabel="canned reply"
      exportFileName="canned-replies"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <CannedReplyForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      permissionModule="CannedReply"
      columnDefs={CANNED_REPLY_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by name or text…"
    />
  );
}
