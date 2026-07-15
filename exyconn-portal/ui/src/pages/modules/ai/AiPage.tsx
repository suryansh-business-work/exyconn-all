import { useCallback, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { ServerDataGrid, type TablePageResult } from '../../../components/data/ServerDataGrid';
import { CrudDialog } from '../../../components/data/CrudDialog';
import { ModuleDashboard } from '../../../components/dashboard/ModuleDashboard';
import type { StatItem } from '../../../components/dashboard/StatCard';
import { useCrudDialog } from '../../../hooks/useCrudDialog';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useNotify } from '../../../components/feedback/NotificationProvider';
import {
  useListAiJobsQuery,
  useDeleteAiJobMutation,
  ListAiJobsPagedDocument,
  type ListAiJobsPagedQuery,
  type ListAiJobsPagedQueryVariables,
  type TableQueryInput,
} from '../../../graphql/generated';
import { AiJobForm, type AiJobRow } from './forms/ai-job';
import { AI_JOB_COLUMNS, type PagedAiJobRow, type AiJobsGridContext } from './ai-jobs-grid';

/** AI module — AI jobs dashboard with a server-side jobs grid. */
export function AiPage() {
  // Stat cards still summarise all jobs; the grid itself is server-paged.
  const { data } = useListAiJobsQuery();
  const [deleteAiJob] = useDeleteAiJobMutation();
  const dialog = useCrudDialog<AiJobRow>();
  const confirm = useConfirm();
  const notify = useNotify();
  const client = useApolloClient();
  const [refreshSignal, setRefreshSignal] = useState(0);

  const rows = data?.listAiJobs ?? [];
  const stats: StatItem[] = [
    { label: 'Jobs', value: String(rows.length), accent: '#4f8cff' },
    {
      label: 'Running',
      value: String(rows.filter((r) => r.status === 'RUNNING').length),
      accent: '#6366f1',
    },
    {
      label: 'Succeeded',
      value: String(rows.filter((r) => r.status === 'SUCCEEDED').length),
      accent: '#7be37b',
    },
    {
      label: 'Failed',
      value: String(rows.filter((r) => r.status === 'FAILED').length),
      accent: '#ff6b6b',
    },
  ];

  const reload = () => setRefreshSignal((n) => n + 1);

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
      stats={stats}
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
