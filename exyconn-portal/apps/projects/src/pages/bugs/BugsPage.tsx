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
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import {
  useListBugsStatsQuery,
  useDeleteBugMutation,
  ListBugsPagedDocument,
  type ListBugsPagedQuery,
  type ListBugsPagedQueryVariables,
  type TableQueryInput,
} from '@exyconn/shell/graphql/generated';
import { BugForm, type BugRow } from './forms/bug';
import { BUG_COLUMNS, type PagedBugRow, type BugsGridContext } from './bugs-grid';

/** Bugs module — issue tracking dashboard with a server-side bugs grid. */
export function BugsPage() {
  // Stat cards come from one server aggregation; the grid is server-paged separately.
  const { data: statsData, refetch: refetchStats } = useListBugsStatsQuery();
  const [deleteBug] = useDeleteBugMutation();
  const dialog = useCrudDialog<BugRow>();
  const confirm = useConfirm();
  const notify = useNotify();
  const { formatDate } = useSettings();
  const client = useApolloClient();
  const [refreshSignal, setRefreshSignal] = useState(0);

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

  const reload = () => {
    setRefreshSignal((n) => n + 1);
    void refetchStats();
  };

  const fetchRows = useCallback(
    async (input: TableQueryInput): Promise<TablePageResult<PagedBugRow>> => {
      const result = await client.query<ListBugsPagedQuery, ListBugsPagedQueryVariables>({
        query: ListBugsPagedDocument,
        variables: { input },
        fetchPolicy: 'network-only',
      });
      return {
        rows: result.data.listBugsPaged.rows,
        totalCount: result.data.listBugsPaged.totalCount,
      };
    },
    [client],
  );

  const handleDelete = async (row: PagedBugRow) => {
    const ok = await confirm({ message: `Delete bug "${row.title}"?`, confirmText: 'Delete' });
    if (!ok) {
      return;
    }
    await deleteBug({ variables: { id: row.id } });
    reload();
    notify('Bug deleted');
  };

  const gridContext: BugsGridContext = {
    onEdit: dialog.openEdit,
    onDelete: handleDelete,
    formatDate,
  };

  return (
    <ModuleDashboard
      title="Bugs"
      subtitle="Issue tracking"
      actionLabel="New bug"
      onAction={dialog.openCreate}
      stats={statItems}
      dialog={
        <CrudDialog
          open={dialog.open}
          title={dialog.editing ? 'Edit bug' : 'New bug'}
          onClose={dialog.close}
        >
          <BugForm
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
      <ServerDataGrid<PagedBugRow>
        columnDefs={BUG_COLUMNS}
        fetchRows={fetchRows}
        context={gridContext}
        refreshSignal={refreshSignal}
        searchPlaceholder="Search bugs…"
      />
    </ModuleDashboard>
  );
}
