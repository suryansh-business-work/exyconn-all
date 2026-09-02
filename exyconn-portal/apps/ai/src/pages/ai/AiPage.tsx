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
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import {
  useListAiJobsStatsQuery,
  useDeleteAiJobMutation,
  ListAiJobsPagedDocument,
  type ListAiJobsPagedQuery,
  type ListAiJobsPagedQueryVariables,
  type TableQueryInput,
} from '@exyconn/shell/graphql/generated';
import { AiJobForm, type AiJobRow } from './forms/ai-job';
import { AI_JOB_COLUMNS, type PagedAiJobRow, type AiJobsGridContext } from './ai-jobs-grid';

/** AI module — AI jobs dashboard with a server-side jobs grid. */
export function AiPage() {
  // Stat cards come from one server aggregation; the grid is server-paged separately.
  const { data: statsData, refetch: refetchStats } = useListAiJobsStatsQuery();
  const [deleteAiJob] = useDeleteAiJobMutation();
  const dialog = useCrudDialog<AiJobRow>();
  const confirm = useConfirm();
  const notify = useNotify();
  const client = useApolloClient();
  const [refreshSignal, setRefreshSignal] = useState(0);

  const stats = statsData?.listAiJobsStats;
  const statItems: StatItem[] = [
    { label: 'Jobs', value: String(statTotal(stats)), accent: '#4f8cff' },
    { label: 'Running', value: String(statCount(stats, 'status', 'RUNNING')), accent: '#6366f1' },
    {
      label: 'Succeeded',
      value: String(statCount(stats, 'status', 'SUCCEEDED')),
      accent: '#7be37b',
    },
    { label: 'Failed', value: String(statCount(stats, 'status', 'FAILED')), accent: '#ff6b6b' },
  ];

  const reload = () => {
    setRefreshSignal((n) => n + 1);
    void refetchStats();
  };

  const fetchRows = useCallback(
    async (input: TableQueryInput): Promise<TablePageResult<PagedAiJobRow>> => {
      const result = await client.query<ListAiJobsPagedQuery, ListAiJobsPagedQueryVariables>({
        query: ListAiJobsPagedDocument,
        variables: { input },
        fetchPolicy: 'network-only',
      });
      return {
        rows: result.data.listAiJobsPaged.rows,
        totalCount: result.data.listAiJobsPaged.totalCount,
      };
    },
    [client],
  );

  const handleDelete = async (row: PagedAiJobRow) => {
    const ok = await confirm({ message: `Delete AI job "${row.name}"?`, confirmText: 'Delete' });
    if (!ok) {
      return;
    }
    await deleteAiJob({ variables: { id: row.id } });
    reload();
    notify('AI job deleted');
  };

  const gridContext: AiJobsGridContext = {
    onEdit: dialog.openEdit,
    onDelete: handleDelete,
  };

  return (
    <ModuleDashboard
      title="AI"
      subtitle="AI jobs"
      actionLabel="New job"
      onAction={dialog.openCreate}
      stats={statItems}
      dialog={
        <CrudDialog
          open={dialog.open}
          title={dialog.editing ? 'Edit job' : 'New job'}
          onClose={dialog.close}
        >
          <AiJobForm
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
      <ServerDataGrid<PagedAiJobRow>
        columnDefs={AI_JOB_COLUMNS}
        fetchRows={fetchRows}
        context={gridContext}
        refreshSignal={refreshSignal}
        searchPlaceholder="Search AI jobs…"
      />
    </ModuleDashboard>
  );
}
