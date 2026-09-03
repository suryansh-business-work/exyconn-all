import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import {
  ModuleOverview,
  type OverviewBreakdown,
} from '@exyconn/shell/components/dashboard/ModuleOverview';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import {
  useListAiJobsQuery,
  useListAiJobsStatsQuery,
  useListPromptsStatsQuery,
} from '@exyconn/shell/graphql/generated';
import type { AiJobRow } from './forms/ai-job';

/** How many of the newest jobs the overview lists before sending you to the register. */
const RECENT_JOBS = 8;

/** AI → Overview: what has been run, what is still running, and what failed. */
export function AiOverviewPage() {
  const { data: jobStatsData } = useListAiJobsStatsQuery();
  const { data: promptStatsData } = useListPromptsStatsQuery();
  const { data: jobsData, loading } = useListAiJobsQuery();

  const jobStats = jobStatsData?.listAiJobsStats;
  const jobs = jobsData?.listAiJobs ?? [];
  const failed = jobs.filter((job) => job.status === 'FAILED');

  const statItems: StatItem[] = [
    { label: 'Jobs', value: String(statTotal(jobStats)), accent: '#4f8cff' },
    {
      label: 'Running',
      value: String(statCount(jobStats, 'status', 'RUNNING')),
      accent: '#f59e0b',
    },
    { label: 'Failed', value: String(statCount(jobStats, 'status', 'FAILED')), accent: '#ff6b6b' },
    {
      label: 'Prompts',
      value: String(statTotal(promptStatsData?.listPromptsStats)),
      accent: '#8b5cf6',
    },
  ];

  const breakdowns: OverviewBreakdown[] = [
    {
      title: 'By status',
      buckets: jobStats?.counts.find((c) => c.field === 'status')?.buckets ?? [],
      accent: '#4f8cff',
    },
    {
      title: 'By model',
      buckets: jobStats?.counts.find((c) => c.field === 'model')?.buckets ?? [],
      accent: '#8b5cf6',
    },
  ];

  const columns: Column<AiJobRow>[] = [
    { key: 'name', label: 'Job' },
    { key: 'model', label: 'Model' },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
  ];

  const rows = failed.length > 0 ? failed : jobs;

  return (
    <ModuleOverview
      title="AI"
      subtitle="Jobs and the prompt library at a glance"
      stats={statItems}
      breakdowns={breakdowns}
      links={[
        { label: 'Open jobs', to: '/ai/jobs' },
        { label: 'Open prompt library', to: '/ai/prompts' },
      ]}
      recentTitle={failed.length > 0 ? 'Failed jobs' : 'Newest jobs'}
    >
      <DataTable
        columns={columns}
        rows={rows.slice(0, RECENT_JOBS)}
        emptyMessage={loading ? 'Loading…' : 'No jobs yet.'}
      />
    </ModuleOverview>
  );
}
