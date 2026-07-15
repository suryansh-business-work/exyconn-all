import { useCallback, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { ServerDataGrid, type TablePageResult } from '../../../components/data/ServerDataGrid';
import { CrudDialog } from '../../../components/data/CrudDialog';
import { ModuleDashboard } from '../../../components/dashboard/ModuleDashboard';
import type { StatItem } from '../../../components/dashboard/StatCard';
import { useCrudDialog } from '../../../hooks/useCrudDialog';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useNotify } from '../../../components/feedback/NotificationProvider';
import { useSettings } from '../../../hooks/useSettings';
import {
  useListBugsQuery,
  useDeleteBugMutation,
  ListBugsPagedDocument,
  type ListBugsPagedQuery,
  type ListBugsPagedQueryVariables,
  type TableQueryInput,
} from '../../../graphql/generated';
import { BugForm, type BugRow } from './forms/bug';
import { BUG_COLUMNS, type PagedBugRow, type BugsGridContext } from './bugs-grid';

/** Bugs module — issue tracking dashboard with a server-side bugs grid. */
export function BugsPage() {
  // Stat cards still summarise all bugs; the grid itself is server-paged.
  const { data } = useListBugsQuery();
  const [deleteBug] = useDeleteBugMutation();
  const dialog = useCrudDialog<BugRow>();
  const confirm = useConfirm();
  const notify = useNotify();
  const { formatDate } = useSettings();
  const client = useApolloClient();
  const [refreshSignal, setRefreshSignal] = useState(0);

  const rows = data?.listBugs ?? [];
  const stats: StatItem[] = [
    { label: 'Total bugs', value: String(rows.length), accent: '#4f8cff' },
    { label: 'Open', value: String(rows.filter((r) => r.status === 'OPEN').length), accent: '#f9851f' },
    {
      label: 'Critical',
      value: String(rows.filter((r) => r.severity === 'CRITICAL').length),
      accent: '#ff6b6b',
    },
    {
      label: 'Resolved',
      value: String(rows.filter((r) => r.status === 'RESOLVED').length),
      accent: '#7be37b',
    },
  ];

  const reload = () => setRefreshSignal((n) => n + 1);

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
      stats={stats}
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
