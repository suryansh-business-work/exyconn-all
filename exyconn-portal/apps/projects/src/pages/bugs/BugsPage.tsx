import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import {
  useListBugsStatsQuery,
  useDeleteBugMutation,
  ListBugsPagedDocument,
  type ListBugsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { BugForm, type BugRow } from './forms/bug';
import { BUG_COLUMNS, type PagedBugRow, type BugsGridContext } from './bugs-grid';

/** Bugs module — issue tracking dashboard with a server-side bugs grid. */
export function BugsPage() {
  // Stat cards come from one server aggregation; the grid is server-paged separately.
  const { data: statsData, refetch: refetchStats } = useListBugsStatsQuery();
  const [deleteBug] = useDeleteBugMutation();
  const { formatDate } = useSettings();
  const crud = useCrudResource<BugRow, PagedBugRow>({
    label: 'Bug',
    onDelete: (row) => deleteBug({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete bug "${row.title}"?`,
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListBugsPagedDocument,
    (data: ListBugsPagedQuery) => data.listBugsPaged,
  );

  const stats = statsData?.listBugsStats;
  const statItems: StatItem[] = [
    { label: 'Total bugs', value: String(statTotal(stats)), accent: '#4f8cff' },
    { label: 'Open', value: String(statCount(stats, 'status', 'OPEN')), accent: '#f9851f' },
    {
      label: 'Critical',
      value: String(statCount(stats, 'severity', 'CRITICAL')),
      accent: '#ff6b6b',
    },
    {
      label: 'Resolved',
      value: String(statCount(stats, 'status', 'RESOLVED')),
      accent: '#7be37b',
    },
  ];

  const gridContext: BugsGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Bugs"
      subtitle="Issue tracking"
      entityLabel="bug"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <BugForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={BUG_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search bugs…"
    />
  );
}
