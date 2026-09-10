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
  useListAuditLogsPagedQuery,
  useListAuditLogsStatsQuery,
  useListClientsStatsQuery,
  useListUsersStatsQuery,
  type ListAuditLogsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { color } from '@exyconn/shell/components/ui';

/** How many of the newest logged changes the overview lists before sending you to the log. */
const RECENT_CHANGES = 8;

type AuditRow = ListAuditLogsPagedQuery['listAuditLogsPaged']['rows'][number];

/** Admin → Overview: who is in the workspace, who it serves, and what has been changing. */
export function AdminOverviewPage() {
  const { data: userStatsData } = useListUsersStatsQuery();
  const { data: clientStatsData } = useListClientsStatsQuery();
  const { data: auditStatsData } = useListAuditLogsStatsQuery();
  const { data: auditData, loading } = useListAuditLogsPagedQuery({
    // No sort: the log's own default is newest-first, which is what an overview wants.
    variables: { input: { page: 1, pageSize: RECENT_CHANGES } },
  });
  const { formatDateTime } = useSettings();

  const userStats = userStatsData?.listUsersStats;
  const clientStats = clientStatsData?.listClientsStats;
  const auditStats = auditStatsData?.listAuditLogsStats;
  const changes = auditData?.listAuditLogsPaged.rows ?? [];

  const statItems: StatItem[] = [
    { label: 'Users', value: String(statTotal(userStats)), accent: color.blue[400] },
    {
      // The aggregation groups on a boolean, so the bucket is the string "true".
      label: 'Active',
      value: String(statCount(userStats, 'isActive', 'true')),
      accent: color.green[500],
    },
    { label: 'Clients', value: String(statTotal(clientStats)), accent: color.cyan[600] },
    { label: 'Logged changes', value: String(statTotal(auditStats)), accent: color.violet[400] },
  ];

  const breakdowns: OverviewBreakdown[] = [
    {
      title: 'Users by role',
      buckets: userStats?.counts.find((c) => c.field === 'roles')?.buckets ?? [],
      accent: color.blue[400],
    },
    {
      title: 'Changes by module',
      buckets: auditStats?.counts.find((c) => c.field === 'module')?.buckets ?? [],
      accent: color.violet[400],
    },
  ];

  const columns: Column<AuditRow>[] = [
    { key: 'actorName', label: 'Who' },
    { key: 'action', label: 'Action', render: (r) => <StatusChip value={r.action} /> },
    { key: 'module', label: 'Module' },
    { key: 'entityLabel', label: 'Record' },
    { key: 'createdAt', label: 'When', render: (r) => formatDateTime(r.createdAt) },
  ];

  return (
    <ModuleOverview
      title="Admin"
      subtitle="People, clients and what has been changing"
      stats={statItems}
      breakdowns={breakdowns}
      links={[
        { label: 'Open users', to: '/admin/users' },
        { label: 'Open clients', to: '/clients' },
        { label: 'Open audit log', to: '/admin/audit' },
        { label: 'System health', to: '/admin/health' },
      ]}
      recentTitle="Latest changes"
    >
      <DataTable
        columns={columns}
        rows={changes}
        emptyMessage={loading ? 'Loading…' : 'Nothing has been changed yet.'}
      />
    </ModuleOverview>
  );
}
