import { useT } from '@exyconn/i18n';
import { Text, color } from '@exyconn/shell/components/ui';
import { ModuleOverview } from '@exyconn/shell/components/dashboard/ModuleOverview';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { useItDashboardQuery, type ItDashboardQuery } from '@exyconn/shell/graphql/generated';
import { DashboardLists } from './DashboardLists';

type Dashboard = ItDashboardQuery['itDashboard'];

/** The eight numbers IT looks at first, most urgent first. */
function tilesOf(d: Dashboard): StatItem[] {
  return [
    { label: 'Open IT tickets', value: String(d.openTickets), accent: color.cyan[600] },
    { label: 'Overdue tickets', value: String(d.overdueTickets), accent: color.red[500] },
    { label: 'Active incidents', value: String(d.activeIncidents), accent: color.amber[500] },
    { label: 'Outages', value: String(d.activeOutages), accent: color.red[500] },
    {
      label: 'Pending approvals',
      value: String(d.pendingAccess + d.pendingChanges + d.pendingPurchases),
      accent: color.violet[400],
    },
    {
      label: 'Assets assigned',
      value: `${d.assetsAssigned} / ${d.assetsTotal}`,
      accent: color.blue[400],
    },
    {
      label: 'Expiring soon',
      value: String(d.warrantiesEnding + d.licencesRenewing + d.certificatesExpiring),
      accent: color.orange[500],
    },
    {
      label: 'Critical vulnerabilities',
      value: String(d.criticalVulnerabilities),
      accent: color.red[500],
    },
  ];
}

/** Where every tile leads. */
const LINKS = [
  { label: 'Helpdesk', to: '/it/helpdesk' },
  { label: 'Incidents', to: '/it/incidents' },
  { label: 'Access requests', to: '/it/access' },
  { label: 'Changes', to: '/it/changes' },
  { label: 'Assets', to: '/it/assets' },
  { label: 'Security Center', to: '/it/security' },
];

/**
 * IT › Dashboard: tickets, outages, pending approvals, the estate and what is about to lapse,
 * then the incidents, changes and announcements behind those numbers.
 */
export function DashboardPage() {
  const t = useT();
  const { data, error } = useItDashboardQuery({ fetchPolicy: 'cache-and-network' });
  const dashboard = data?.itDashboard;

  return (
    <ModuleOverview
      title="IT"
      subtitle="Tickets, outages, approvals, assets and announcements"
      stats={dashboard ? tilesOf(dashboard) : []}
      links={LINKS}
      recentTitle="What needs attention"
    >
      {dashboard && <DashboardLists dashboard={dashboard} />}
      {error && (
        <Text color="error">
          {t('The dashboard could not load: {reason}', { reason: error.message })}
        </Text>
      )}
    </ModuleOverview>
  );
}
