import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import {
  ModuleOverview,
  type OverviewBreakdown,
} from '@exyconn/shell/components/dashboard/ModuleOverview';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useStatusOverviewQuery,
  useEmailDashboardQuery,
  useListProblemReportsStatsQuery,
  type StatusOverviewQuery,
} from '@exyconn/shell/graphql/generated';
import { OVERVIEW_DAYS, RECENT_SERVICES } from './tech-overview.constants';
import { openProblemReports, unhealthyServices, uptimeLabel } from './tech-overview.summary';

type ServiceRow = StatusOverviewQuery['statusOverview']['services'][number];

/** Green while everything answers, red the moment one service does not. */
const healthAccent = (down: number, degraded: number): string => {
  if (down > 0) {
    return '#ff6b6b';
  }
  return degraded > 0 ? '#f59e0b' : '#22c55e';
};

/**
 * Tech → Overview: the module's landing page. Tech owns the plumbing every other portal
 * runs on — the integrations, the outbound email and the uptime checks — so this answers
 * the one question the individual pages cannot: is any of it broken right now.
 */
export function TechOverviewPage() {
  const { data: statusData, loading } = useStatusOverviewQuery({
    variables: { days: OVERVIEW_DAYS },
    fetchPolicy: 'cache-and-network',
  });
  const { data: emailData } = useEmailDashboardQuery({ variables: { days: OVERVIEW_DAYS } });
  const { data: reportsData } = useListProblemReportsStatsQuery();
  const { formatDateTime } = useSettings();

  const status = statusData?.statusOverview;
  const email = emailData?.emailDashboard;
  const reportStats = reportsData?.listProblemReportsStats;

  const services = status?.services ?? [];
  const unhealthy = unhealthyServices(services);
  const openReports = openProblemReports(reportStats);

  const statItems: StatItem[] = [
    {
      label: 'Services answering',
      value: `${status?.operational ?? 0} / ${status?.total ?? 0}`,
      accent: healthAccent(status?.down ?? 0, status?.degraded ?? 0),
    },
    {
      label: 'Uptime, 30 days',
      value: uptimeLabel(status?.uptime30d ?? 0),
      accent: '#4f8cff',
      series: (status?.daily ?? []).map((day) => day.uptimePercent),
    },
    {
      label: `Email sent, ${OVERVIEW_DAYS}d`,
      value: String(email?.sent ?? 0),
      accent: email?.failed ? '#f59e0b' : '#8b5cf6',
      series: (email?.days ?? []).map((day) => day.sent),
    },
    {
      label: 'Open problem reports',
      value: String(openReports),
      accent: openReports > 0 ? '#f59e0b' : '#22c55e',
    },
  ];

  const breakdowns: OverviewBreakdown[] = [
    {
      title: 'Problem reports by severity',
      buckets: reportStats?.counts.find((c) => c.field === 'severity')?.buckets ?? [],
      accent: '#ff6b6b',
    },
    {
      title: `Email by template, ${OVERVIEW_DAYS}d`,
      buckets: (email?.byTemplate ?? []).map((t) => ({ value: t.name, count: t.sent })),
      accent: '#8b5cf6',
    },
  ];

  const columns: Column<ServiceRow>[] = [
    { key: 'name', label: 'Service' },
    { key: 'category', label: 'Category' },
    { key: 'state', label: 'State', render: (r) => <StatusChip value={r.state} /> },
    { key: 'responseMs', label: 'Response', render: (r) => `${r.responseMs} ms` },
    { key: 'uptime30d', label: 'Uptime 30d', render: (r) => uptimeLabel(r.uptime30d) },
    {
      key: 'lastCheckedAt',
      label: 'Last checked',
      render: (r) => formatDateTime(r.lastCheckedAt),
    },
  ];

  const rows = unhealthy.length > 0 ? unhealthy : services;

  return (
    <ModuleOverview
      title="Tech"
      subtitle="Integrations, outbound email and uptime at a glance"
      stats={statItems}
      breakdowns={breakdowns}
      links={[
        { label: 'Environment variables', to: '/tech/environment-variables' },
        { label: 'Email', to: '/tech/email' },
        { label: 'Status monitors', to: '/tech/status-monitors' },
        { label: 'Problem reports', to: '/tech/problem-reports' },
        { label: 'Tracker build', to: '/tech/tracker-build' },
      ]}
      recentTitle={unhealthy.length > 0 ? 'Not answering normally' : 'Monitored services'}
    >
      <DataTable
        columns={columns}
        rows={rows.slice(0, RECENT_SERVICES)}
        emptyMessage={loading ? 'Loading…' : 'No services are being monitored yet.'}
      />
    </ModuleOverview>
  );
}
