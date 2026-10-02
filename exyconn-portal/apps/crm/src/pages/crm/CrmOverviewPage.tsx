import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { ModuleOverview } from '@exyconn/shell/components/dashboard/ModuleOverview';
import { formatMoney } from '@exyconn/shell/utils/money';
import {
  useDealForecastQuery,
  useListCompaniesStatsQuery,
  useListContactsStatsQuery,
  useListDealsStatsQuery,
  useListLeadsQuery,
  useListLeadsStatsQuery,
} from '@exyconn/shell/graphql/generated';
import type { LeadRow } from './forms/lead';
import { crmBreakdowns, crmStatItems, type CrmOverviewSource } from './crm-overview.tiles';

/** How many of the newest leads the overview lists before sending you to the register. */
const RECENT_LEADS = 8;

const COLUMNS: Column<LeadRow>[] = [
  { key: 'name', label: 'Lead' },
  { key: 'email', label: 'Email' },
  { key: 'stage', label: 'Stage', render: (r) => <StatusChip value={r.stage} /> },
  { key: 'owner', label: 'Owner' },
  { key: 'value', label: 'Value', render: (r) => formatMoney(r.value) },
];

/** CRM → Overview: the whole funnel, from new leads to the weighted deal forecast. */
export function CrmOverviewPage() {
  const { data: leadStats, loading: leadStatsLoading } = useListLeadsStatsQuery();
  const { data: dealStats, loading: dealStatsLoading } = useListDealsStatsQuery();
  const { data: companyStats, loading: companyStatsLoading } = useListCompaniesStatsQuery();
  const { data: contactStats, loading: contactStatsLoading } = useListContactsStatsQuery();
  const { data: forecastData, loading: forecastLoading } = useDealForecastQuery();
  const { data: leadsData, loading, refetch } = useListLeadsQuery();

  const source: CrmOverviewSource = {
    leads: leadStats?.listLeadsStats,
    deals: dealStats?.listDealsStats,
    companies: companyStats?.listCompaniesStats,
    contacts: contactStats?.listContactsStats,
    forecast: forecastData?.dealForecast,
  };
  const statsLoading =
    (!leadStats && leadStatsLoading) ||
    (!dealStats && dealStatsLoading) ||
    (!companyStats && companyStatsLoading) ||
    (!contactStats && contactStatsLoading) ||
    (!forecastData && forecastLoading);
  const leads = leadsData?.listLeads ?? [];

  return (
    <ModuleOverview
      title="CRM"
      subtitle="Pipeline at a glance"
      stats={crmStatItems(source)}
      statsLoading={statsLoading}
      breakdowns={crmBreakdowns(source)}
      links={[
        { label: 'Open leads register', to: '/crm/leads' },
        { label: 'Open deals board', to: '/crm/deals' },
        { label: 'Open deals list', to: '/crm/deals/list' },
      ]}
      recentTitle="Newest leads"
    >
      <DataTable
        columns={COLUMNS}
        rows={leads.slice(0, RECENT_LEADS)}
        emptyMessage="No leads yet."
        loading={loading}
        onRefresh={refetch}
      />
    </ModuleOverview>
  );
}
