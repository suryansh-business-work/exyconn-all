import {
  ModuleOverview,
  type OverviewBreakdown,
} from '@exyconn/shell/components/dashboard/ModuleOverview';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import {
  ProjectRisk,
  useListBugsStatsQuery,
  useListProjectsStatsQuery,
  useProjectHealthOverviewQuery,
} from '@exyconn/shell/graphql/generated';
import { color } from '@exyconn/shell/components/ui';
import { PortfolioTable, type PortfolioRow } from './portfolio';

/** A bug in either of these is still someone's problem; the other two are done with. */
const OPEN_BUG_STATUSES = ['OPEN', 'IN_PROGRESS'];

/**
 * Projects → Overview: what is being delivered, and what is going wrong with it.
 *
 * The counts along the top say how much work exists. The panel underneath says which of it
 * is in trouble and why — which is the question somebody actually opens this page with, and
 * the one four stat cards have never been able to answer.
 */
export function ProjectsOverviewPage() {
  const { data: projectStatsData } = useListProjectsStatsQuery();
  const { data: bugStatsData } = useListBugsStatsQuery();
  const {
    data: healthData,
    loading,
    refetch,
  } = useProjectHealthOverviewQuery({ fetchPolicy: 'cache-and-network' });

  const projectStats = projectStatsData?.listProjectsStats;
  const bugStats = bugStatsData?.listBugsStats;

  // The table keys rows on `id`; the health query calls the same value `projectId`.
  const portfolio: PortfolioRow[] = (healthData?.projectHealthOverview ?? []).map((row) => ({
    ...row,
    id: row.projectId,
  }));
  const atRisk = portfolio.filter((row) => row.risk === ProjectRisk.High).length;

  const openBugs = OPEN_BUG_STATUSES.reduce(
    (sum, status) => sum + statCount(bugStats, 'status', status),
    0,
  );

  const statItems: StatItem[] = [
    { label: 'Projects', value: String(statTotal(projectStats)), accent: color.blue[400] },
    {
      label: 'Active',
      value: String(statCount(projectStats, 'status', 'ACTIVE')),
      accent: color.green[500],
    },
    // Counted from the same ratings the panel below explains, so the card and the list can
    // never disagree about how many projects are in trouble.
    { label: 'At risk', value: String(atRisk), accent: color.red[200] },
    { label: 'Open bugs', value: String(openBugs), accent: color.amber[500] },
  ];

  const breakdowns: OverviewBreakdown[] = [
    {
      title: 'Projects by status',
      buckets: projectStats?.counts.find((c) => c.field === 'status')?.buckets ?? [],
      accent: color.blue[400],
    },
    {
      title: 'Bugs by severity',
      buckets: bugStats?.counts.find((c) => c.field === 'severity')?.buckets ?? [],
      accent: color.amber[500],
    },
  ];

  return (
    <ModuleOverview
      title="Projects"
      subtitle="Delivery at a glance"
      stats={statItems}
      breakdowns={breakdowns}
      links={[
        { label: 'Open project register', to: '/projects/list' },
        { label: 'Open bugs', to: '/bugs' },
      ]}
      recentTitle="Portfolio — the ones in trouble first"
    >
      <PortfolioTable rows={portfolio} loading={loading} onRefresh={refetch} />
    </ModuleOverview>
  );
}
