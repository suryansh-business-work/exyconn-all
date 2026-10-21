import { useFormatters } from '@exyconn/i18n';
import {
  ModuleOverview,
  type OverviewBreakdown,
} from '@exyconn/shell/components/dashboard/ModuleOverview';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { Alert, color } from '@exyconn/shell/components/ui';
import {
  useCampaignLeadCountsQuery,
  useMarketingDashboardQuery,
} from '@exyconn/shell/graphql/generated';
import { DashboardActivity } from './DashboardActivity';

/** Marketing → Overview: what is in flight, what went out this month, and what it did. */
export function MarketingOverviewPage() {
  const { formatNumber } = useFormatters();
  const { data, loading, error } = useMarketingDashboardQuery({ fetchPolicy: 'cache-and-network' });
  const { data: leadsData } = useCampaignLeadCountsQuery();
  const dashboard = data?.marketingDashboard;
  const leads = (leadsData?.campaignLeadCounts ?? []).reduce((sum, row) => sum + row.leads, 0);
  const n = (value?: number) => formatNumber(value ?? 0);

  const statItems: StatItem[] = [
    { label: 'Campaigns', value: n(dashboard?.campaigns), accent: color.blue[400] },
    { label: 'Scheduled', value: n(dashboard?.scheduled), accent: color.violet[400] },
    { label: 'Sent (30 days)', value: n(dashboard?.sentLast30), accent: color.green[500] },
    {
      label: 'Click rate (30 days)',
      value: `${n(dashboard?.clickRateLast30)}%`,
      accent: color.orange[500],
    },
    {
      label: 'Unsubscribes (30 days)',
      value: n(dashboard?.unsubscribesLast30),
      accent: color.red[500],
    },
    { label: 'Leads generated', value: n(leads), accent: color.pink[400] },
  ];
  const breakdowns: OverviewBreakdown[] = dashboard
    ? [
        {
          title: 'Campaigns by delivery',
          buckets: [
            { value: 'DRAFT', count: dashboard.drafts },
            { value: 'QUEUED', count: dashboard.scheduled },
            { value: 'SENDING', count: dashboard.sending },
          ],
          accent: color.blue[400],
        },
        {
          title: 'Reach',
          buckets: [
            { value: 'AUDIENCES', count: dashboard.audiences },
            { value: 'SUPPRESSED', count: dashboard.suppressed },
            { value: 'FAILED (30 DAYS)', count: dashboard.failedLast30 },
          ],
          accent: color.violet[400],
        },
      ]
    : [];

  return (
    <ModuleOverview
      title="Marketing"
      subtitle="Campaigns, audiences and results at a glance"
      stats={statItems}
      statsLoading={!data && loading}
      breakdowns={breakdowns}
      links={[
        { label: 'New campaign', to: '/marketing/campaigns/new' },
        { label: 'Open campaigns', to: '/marketing/campaigns' },
        { label: 'Open audiences', to: '/marketing/audiences' },
        { label: 'Open templates', to: '/marketing/templates' },
        { label: 'Email preferences', to: '/marketing/preferences' },
        { label: 'Open suppression list', to: '/marketing/suppression' },
      ]}
      recentTitle="Activity"
    >
      {error && <Alert severity="error">{error.message}</Alert>}
      {dashboard && <DashboardActivity dashboard={dashboard} />}
    </ModuleOverview>
  );
}
