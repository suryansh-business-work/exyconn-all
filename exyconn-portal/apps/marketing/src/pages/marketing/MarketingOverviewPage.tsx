import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import {
  ModuleOverview,
  type OverviewBreakdown,
} from '@exyconn/shell/components/dashboard/ModuleOverview';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statSum, statTotal } from '@exyconn/shell/components/data/tableStats';
import { formatMoney } from '@exyconn/shell/utils/money';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useCampaignLeadCountsQuery,
  useListCampaignsQuery,
  useListCampaignsStatsQuery,
} from '@exyconn/shell/graphql/generated';
import type { CampaignRow } from './forms/campaign';
import { color } from '@exyconn/shell/components/ui';

/** How many of the newest campaigns the overview lists before sending you to the register. */
const RECENT_CAMPAIGNS = 8;

/** Marketing → Overview: what is running, what it costs, and who it reached. */
export function MarketingOverviewPage() {
  const { data: statsData } = useListCampaignsStatsQuery();
  const { data: campaignsData, loading } = useListCampaignsQuery();
  const { data: leadsData } = useCampaignLeadCountsQuery();
  const { formatDate } = useSettings();

  const stats = statsData?.listCampaignsStats;
  const campaigns = campaignsData?.listCampaigns ?? [];
  const reached = campaigns.reduce((sum, c) => sum + (c.recipientsCount ?? 0), 0);
  const leadCounts = leadsData?.campaignLeadCounts ?? [];
  const leadsGenerated = leadCounts.reduce((sum, row) => sum + row.leads, 0);
  const leadsFor = new Map(leadCounts.map((row) => [row.campaignId, row.leads]));

  const statItems: StatItem[] = [
    { label: 'Campaigns', value: String(statTotal(stats)), accent: color.blue[400] },
    {
      label: 'Sent',
      value: String(campaigns.filter((c) => c.lastSentAt).length),
      accent: color.green[500],
    },
    { label: 'Recipients reached', value: String(reached), accent: color.violet[400] },
    { label: 'Leads generated', value: String(leadsGenerated), accent: color.pink[400] },
    { label: 'Budget', value: formatMoney(statSum(stats, 'budget')), accent: color.amber[500] },
  ];

  const breakdowns: OverviewBreakdown[] = [
    {
      title: 'By status',
      buckets: stats?.counts.find((c) => c.field === 'status')?.buckets ?? [],
      accent: color.blue[400],
    },
    {
      title: 'By channel',
      buckets: stats?.counts.find((c) => c.field === 'channel')?.buckets ?? [],
      accent: color.violet[400],
    },
  ];

  const columns: Column<CampaignRow>[] = [
    { key: 'name', label: 'Campaign' },
    { key: 'channel', label: 'Channel' },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
    { key: 'startDate', label: 'Starts', render: (r) => formatDate(r.startDate) },
    { key: 'recipientsCount', label: 'Recipients' },
    { key: 'leads', label: 'Leads', render: (r) => String(leadsFor.get(r.id) ?? 0) },
  ];

  return (
    <ModuleOverview
      title="Marketing"
      subtitle="Campaigns and audiences at a glance"
      stats={statItems}
      breakdowns={breakdowns}
      links={[
        { label: 'Open campaigns', to: '/marketing/campaigns' },
        { label: 'Open audiences', to: '/marketing/audiences' },
        { label: 'Open suppression list', to: '/marketing/suppression' },
      ]}
      recentTitle="Newest campaigns"
    >
      <DataTable
        columns={columns}
        rows={campaigns.slice(0, RECENT_CAMPAIGNS)}
        emptyMessage={loading ? 'Loading…' : 'No campaigns yet.'}
      />
    </ModuleOverview>
  );
}
