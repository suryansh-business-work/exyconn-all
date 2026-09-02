import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import {
  useListAiJobsStatsQuery,
  useDeleteAiJobMutation,
  ListAiJobsPagedDocument,
  type ListAiJobsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { AiJobForm, type AiJobRow } from './forms/ai-job';
import { AI_JOB_COLUMNS, type PagedAiJobRow, type AiJobsGridContext } from './ai-jobs-grid';

/** AI module — AI jobs dashboard with a server-side jobs grid. */
export function AiPage() {
  // Stat cards come from one server aggregation; the grid is server-paged separately.
  const { data: statsData, refetch: refetchStats } = useListAiJobsStatsQuery();
  const [deleteAiJob] = useDeleteAiJobMutation();
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
    { label: 'Running', value: String(statCount(stats, 'status', 'RUNNING')), accent: '#6366f1' },
    {
      label: 'Succeeded',
      value: String(statCount(stats, 'status', 'SUCCEEDED')),
      accent: '#7be37b',
    },
    { label: 'Failed', value: String(statCount(stats, 'status', 'FAILED')), accent: '#ff6b6b' },
  ];

  const gridContext: AiJobsGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
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
    />
  );
}
