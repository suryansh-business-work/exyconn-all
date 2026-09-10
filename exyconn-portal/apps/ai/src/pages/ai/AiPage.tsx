import { useCallback, useState } from 'react';
import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { Alert, color } from '@exyconn/shell/components/ui';
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
import { useAiJobQueue } from './useAiJobQueue';

/** Total AI spend to date, as the stat tile says it. */
const USD_DIGITS = 2;

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

  // `reload` is recreated every render, so the queue watcher needs a stable callback or it
  // would reload the grid on every render rather than on every poll.
  const { reload } = crud;
  const onQueueTick = useCallback(() => reload(), [reload]);
  const queue = useAiJobQueue(onQueueTick);

  const stats = statsData?.listAiJobsStats;
  const statItems: StatItem[] = [
    { label: 'Jobs', value: String(statTotal(stats)), accent: color.blue[400] },
    {
      label: 'Succeeded',
      value: String(statCount(stats, 'status', 'SUCCEEDED')),
      accent: color.green[300],
    },
    {
      label: 'Failed',
      value: String(statCount(stats, 'status', 'FAILED')),
      accent: color.red[200],
    },
    {
      label: 'Spent',
      value: `$${statSum(stats, 'costUsd').toFixed(USD_DIGITS)}`,
      accent: color.violet[400],
    },
  ];

  // The run is queued, not performed: the grid polls until the worker settles the row.
  const run = async (row: PagedAiJobRow) => {
    try {
      await runAiJob({ variables: { id: row.id } });
      notify(`"${row.name}" queued`);
      await Promise.all([crud.reload(), queue.refresh()]);
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

  const queueNotice =
    queue.inFlight > 0 ? (
      <Alert severity="info" sx={{ mb: 1.5 }}>
        {queue.inFlight} job{queue.inFlight === 1 ? '' : 's'} waiting on the AI worker. This list
        refreshes itself until they finish.
      </Alert>
    ) : undefined;

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
      toolbar={queueNotice}
      extraDialogs={
        <CrudDialog open={Boolean(resultId)} title="Run result" onClose={() => setResultId(null)}>
          {resultId && <AiJobResult id={resultId} />}
        </CrudDialog>
      }
    />
  );
}
