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
  const { data: leadStats } = useListLeadsStatsQuery();
  const { data: dealStats } = useListDealsStatsQuery();
  const { data: companyStats } = useListCompaniesStatsQuery();
  const { data: contactStats } = useListContactsStatsQuery();
  const { data: forecastData } = useDealForecastQuery();
  const { data: leadsData, loading } = useListLeadsQuery();

  const source: CrmOverviewSource = {
    leads: leadStats?.listLeadsStats,
    deals: dealStats?.listDealsStats,
    companies: companyStats?.listCompaniesStats,
    contacts: contactStats?.listContactsStats,
    forecast: forecastData?.dealForecast,
  };
  const leads = leadsData?.listLeads ?? [];

  return (
    <ModuleOverview
      title="CRM"
      subtitle="Pipeline at a glance"
      stats={crmStatItems(source)}
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
        emptyMessage={loading ? 'Loading…' : 'No leads yet.'}
      />
    </ModuleOverview>
  );
}
