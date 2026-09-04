import { useState } from 'react';
import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { statCount, statSum, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useListAiJobsStatsQuery,
  useDeleteAiJobMutation,
  useRunAiJobMutation,
  ListAiJobsPagedDocument,
  type ListAiJobsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { AiJobForm, type AiJobRow } from './forms/ai-job';
import { AiJobResult } from './AiJobResult';
import { AI_JOB_COLUMNS, type PagedAiJobRow, type AiJobsGridContext } from './ai-jobs-grid';

/** AI module — the jobs register, where a prompt is actually sent to OpenAI. */
export function AiPage() {
  // Stat cards come from one server aggregation; the grid is server-paged separately.
  const { data: statsData, refetch: refetchStats } = useListAiJobsStatsQuery();
  const [deleteAiJob] = useDeleteAiJobMutation();
  const [runAiJob] = useRunAiJobMutation();
  const [resultId, setResultId] = useState<string | null>(null);
  const notify = useNotify();
  const { formatDate } = useSettings();
  const crud = useCrudResource<AiJobRow, PagedAiJobRow>({
    label: 'AI job',
    onDelete: (row) => deleteAiJob({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete AI job "${row.name}"?`,
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListAiJobsPagedDocument,
    (data: ListAiJobsPagedQuery) => data.listAiJobsPaged,
  );

  const stats = statsData?.listAiJobsStats;
  const statItems: StatItem[] = [
    { label: 'Jobs', value: String(statTotal(stats)), accent: '#4f8cff' },
    {
      label: 'Succeeded',
      value: String(statCount(stats, 'status', 'SUCCEEDED')),
      accent: '#7be37b',
    },
    { label: 'Failed', value: String(statCount(stats, 'status', 'FAILED')), accent: '#ff6b6b' },
    {
      label: 'Tokens used',
      value: statSum(stats, 'totalTokens').toLocaleString(),
      accent: '#8b5cf6',
    },
  ];

  // The run is synchronous, so the row is already final when the grid reloads.
  const run = async (row: PagedAiJobRow) => {
    try {
      const { data } = await runAiJob({ variables: { id: row.id } });
      crud.reload();
      if (data?.runAiJob.status === 'FAILED') {
        notify(data.runAiJob.error, 'error');
        return;
      }
      notify(`"${row.name}" finished`);
      setResultId(row.id);
    } catch (error) {
      notify(errorMessage(error, 'The run could not be started'), 'error');
    }
  };

  const gridContext: AiJobsGridContext = {
    actions: {
      run,
      view: (row) => setResultId(row.id),
      edit: crud.openEdit,
      delete: crud.remove,
    },
    formatDate,
  };

  return (
    <CrudDashboard
      title="AI"
      subtitle="AI jobs"
      entityLabel="job"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <AiJobForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={AI_JOB_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search AI jobs…"
      extraDialogs={
        <CrudDialog open={Boolean(resultId)} title="Run result" onClose={() => setResultId(null)}>
          {resultId && <AiJobResult id={resultId} />}
        </CrudDialog>
      }
    />
  );
}
