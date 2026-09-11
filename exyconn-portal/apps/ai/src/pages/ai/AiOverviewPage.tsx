import { useMemo } from 'react';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import {
  ModuleOverview,
  type OverviewBreakdown,
} from '@exyconn/shell/components/dashboard/ModuleOverview';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statSum, statTotal } from '@exyconn/shell/components/data/tableStats';
import {
  useAiSpendLimitQuery,
  useAiSpendSummaryQuery,
  useListAiJobsQuery,
  useListAiJobsStatsQuery,
  useListPromptsStatsQuery,
} from '@exyconn/shell/graphql/generated';
import type { AiJobRow } from './forms/ai-job';
import { AiSpendPanel } from './AiSpendPanel';
import { monthToDate } from './ai.period';
import { color } from '@exyconn/shell/components/ui';

/** How many of the newest jobs the overview lists before sending you to the register. */
const RECENT_JOBS = 8;

/** Dollars, as the stat tiles say them. */
const USD_DIGITS = 2;

/** AI → Overview: what has been run, what it cost, what is still running and what failed. */
export function AiOverviewPage() {
  const { data: jobStatsData } = useListAiJobsStatsQuery();
  const { data: promptStatsData } = useListPromptsStatsQuery();
  const { data: jobsData, loading, refetch } = useListAiJobsQuery();
  // Recomputed only when the module reloads, so the two boundaries stay stable while the
  // page is open — a window that slid under the user would make the totals jump.
  const period = useMemo(monthToDate, []);
  const {
    data: spendData,
    loading: spendLoading,
    refetch: refetchSpend,
  } = useAiSpendSummaryQuery({ variables: period });
  const { data: limitData } = useAiSpendLimitQuery();

  const jobStats = jobStatsData?.listAiJobsStats;
  const jobs = jobsData?.listAiJobs ?? [];
  const failed = jobs.filter((job) => job.status === 'FAILED');
  const limit = limitData?.aiSpendLimit;
  const spentThisMonth = spendData?.aiSpendSummary.totalUsd ?? 0;

  const capLabel =
    limit?.enabled && limit.monthlyUsdCap > 0
      ? `of $${limit.monthlyUsdCap.toFixed(USD_DIGITS)} cap`
      : 'no cap set';

  const statItems: StatItem[] = [
    { label: 'Jobs', value: String(statTotal(jobStats)), accent: color.blue[400] },
    {
      label: 'Failed',
      value: String(statCount(jobStats, 'status', 'FAILED')),
      accent: color.red[200],
    },
    {
      label: 'Spent all time',
      value: `$${statSum(jobStats, 'costUsd').toFixed(USD_DIGITS)}`,
      accent: color.amber[500],
    },
    {
      label: `This month · ${capLabel}`,
      value: `$${spentThisMonth.toFixed(USD_DIGITS)}`,
      accent: color.green[500],
    },
    {
      label: 'Prompts',
      value: String(statTotal(promptStatsData?.listPromptsStats)),
      accent: color.violet[400],
    },
  ];

  const breakdowns: OverviewBreakdown[] = [
    {
      title: 'By status',
      buckets: jobStats?.counts.find((c) => c.field === 'status')?.buckets ?? [],
      accent: color.blue[400],
    },
    {
      title: 'By model',
      buckets: jobStats?.counts.find((c) => c.field === 'model')?.buckets ?? [],
      accent: color.violet[400],
    },
  ];

  const columns: Column<AiJobRow>[] = [
    { key: 'name', label: 'Job' },
    { key: 'model', label: 'Model' },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
    { key: 'totalTokens', label: 'Tokens', render: (r) => r.totalTokens.toLocaleString() },
  ];

  const rows = failed.length > 0 ? failed : jobs;

  return (
    <ModuleOverview
      title="AI"
      subtitle="Jobs, spending and the prompt library at a glance"
      stats={statItems}
      breakdowns={breakdowns}
      links={[
        { label: 'Open jobs', to: '/ai/jobs' },
        { label: 'Open prompt library', to: '/ai/prompts' },
      ]}
      recentTitle={failed.length > 0 ? 'Failed jobs' : 'Newest jobs'}
    >
      <AiSpendPanel
        summary={spendData?.aiSpendSummary}
        loading={spendLoading}
        onRefresh={refetchSpend}
        periodLabel="this month"
      />
      <DataTable
        columns={columns}
        rows={rows.slice(0, RECENT_JOBS)}
        emptyMessage="No jobs yet."
        loading={loading}
        onRefresh={refetch}
      />
    </ModuleOverview>
  );
}
