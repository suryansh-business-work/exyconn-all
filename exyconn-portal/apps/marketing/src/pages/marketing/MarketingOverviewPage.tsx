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
  useListCampaignsQuery,
  useListCampaignsStatsQuery,
} from '@exyconn/shell/graphql/generated';
import type { CampaignRow } from './forms/campaign';

/** How many of the newest campaigns the overview lists before sending you to the register. */
const RECENT_CAMPAIGNS = 8;

/** Marketing → Overview: what is running, what it costs, and who it reached. */
export function MarketingOverviewPage() {
  const { data: statsData } = useListCampaignsStatsQuery();
  const { data: campaignsData, loading } = useListCampaignsQuery();
  const { formatDate } = useSettings();

  const stats = statsData?.listCampaignsStats;
  const campaigns = campaignsData?.listCampaigns ?? [];
  const reached = campaigns.reduce((sum, c) => sum + (c.recipientsCount ?? 0), 0);

  const statItems: StatItem[] = [
    { label: 'Campaigns', value: String(statTotal(stats)), accent: '#4f8cff' },
    {
      label: 'Sent',
      value: String(campaigns.filter((c) => c.lastSentAt).length),
      accent: '#22c55e',
    },
    { label: 'Recipients reached', value: String(reached), accent: '#8b5cf6' },
    { label: 'Budget', value: formatMoney(statSum(stats, 'budget')), accent: '#f59e0b' },
  ];

  const breakdowns: OverviewBreakdown[] = [
    {
      title: 'By status',
      buckets: stats?.counts.find((c) => c.field === 'status')?.buckets ?? [],
      accent: '#4f8cff',
    },
    {
      title: 'By channel',
      buckets: stats?.counts.find((c) => c.field === 'channel')?.buckets ?? [],
      accent: '#8b5cf6',
    },
  ];

  const columns: Column<CampaignRow>[] = [
    { key: 'name', label: 'Campaign' },
    { key: 'channel', label: 'Channel' },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
    { key: 'startDate', label: 'Starts', render: (r) => formatDate(r.startDate) },
    { key: 'recipientsCount', label: 'Recipients' },
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
