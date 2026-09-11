import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import {
  ModuleOverview,
  type OverviewBreakdown,
} from '@exyconn/shell/components/dashboard/ModuleOverview';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useListBugsStatsQuery,
  useListProjectsQuery,
  useListProjectsStatsQuery,
} from '@exyconn/shell/graphql/generated';
import { color } from '@exyconn/shell/components/ui';

/** How many projects the overview lists before sending you to the register. */
const RECENT_PROJECTS = 8;

/** A bug in either of these is still someone's problem; the other two are done with. */
const OPEN_BUG_STATUSES = ['OPEN', 'IN_PROGRESS'];

/** Projects → Overview: what is being delivered, and what is blocking it. */
export function ProjectsOverviewPage() {
  const { data: projectStatsData } = useListProjectsStatsQuery();
  const { data: bugStatsData } = useListBugsStatsQuery();
  const { data: projectsData, loading, refetch } = useListProjectsQuery();
  const { formatDate } = useSettings();

  const projectStats = projectStatsData?.listProjectsStats;
  const bugStats = bugStatsData?.listBugsStats;
  const projects = projectsData?.listProjects ?? [];

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
    { label: 'Open bugs', value: String(openBugs), accent: color.amber[500] },
    {
      label: 'Critical bugs',
      value: String(statCount(bugStats, 'severity', 'CRITICAL')),
      accent: color.red[200],
    },
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

  const columns: Column<(typeof projects)[number]>[] = [
    { key: 'name', label: 'Project' },
    { key: 'key', label: 'Key' },
    { key: 'clientName', label: 'Client' },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
    { key: 'endDate', label: 'Ends', render: (r) => formatDate(r.endDate) },
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
      recentTitle="Newest projects"
    >
      <DataTable
        columns={columns}
        rows={projects.slice(0, RECENT_PROJECTS)}
        emptyMessage="No projects yet."
        loading={loading}
        onRefresh={refetch}
      />
    </ModuleOverview>
  );
}
