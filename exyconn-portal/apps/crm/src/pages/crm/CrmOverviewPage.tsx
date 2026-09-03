import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import {
  ModuleOverview,
  type OverviewBreakdown,
} from '@exyconn/shell/components/dashboard/ModuleOverview';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statSum, statTotal } from '@exyconn/shell/components/data/tableStats';
import { formatMoney } from '@exyconn/shell/utils/money';
import { useListLeadsQuery, useListLeadsStatsQuery } from '@exyconn/shell/graphql/generated';
import type { LeadRow } from './forms/lead';

/** How many of the newest leads the overview lists before sending you to the register. */
const RECENT_LEADS = 8;

/** CRM → Overview: what the pipeline adds up to, and the newest leads in it. */
export function CrmOverviewPage() {
  const { data: statsData } = useListLeadsStatsQuery();
  const { data: leadsData, loading } = useListLeadsQuery();

  const stats = statsData?.listLeadsStats;
  const leads = leadsData?.listLeads ?? [];

  const statItems: StatItem[] = [
    { label: 'Leads', value: String(statTotal(stats)), accent: '#4f8cff' },
    { label: 'Won', value: String(statCount(stats, 'stage', 'WON')), accent: '#22c55e' },
    { label: 'Lost', value: String(statCount(stats, 'stage', 'LOST')), accent: '#ff6b6b' },
    { label: 'Pipeline value', value: formatMoney(statSum(stats, 'value')), accent: '#8b5cf6' },
  ];

  const breakdowns: OverviewBreakdown[] = [
    {
      title: 'By stage',
      buckets: stats?.counts.find((c) => c.field === 'stage')?.buckets ?? [],
      accent: '#4f8cff',
    },
    {
      title: 'By source',
      buckets: stats?.counts.find((c) => c.field === 'source')?.buckets ?? [],
      accent: '#8b5cf6',
    },
  ];

  const columns: Column<LeadRow>[] = [
    { key: 'name', label: 'Lead' },
    { key: 'email', label: 'Email' },
    { key: 'stage', label: 'Stage', render: (r) => <StatusChip value={r.stage} /> },
    { key: 'owner', label: 'Owner' },
    { key: 'value', label: 'Value', render: (r) => formatMoney(r.value) },
  ];

  return (
    <ModuleOverview
      title="CRM"
      subtitle="Pipeline at a glance"
      stats={statItems}
      breakdowns={breakdowns}
      links={[{ label: 'Open leads register', to: '/crm/leads' }]}
      recentTitle="Newest leads"
    >
      <DataTable
        columns={columns}
        rows={leads.slice(0, RECENT_LEADS)}
        emptyMessage={loading ? 'Loading…' : 'No leads yet.'}
      />
    </ModuleOverview>
  );
}
