import type { OverviewBreakdown } from '@exyconn/shell/components/dashboard/ModuleOverview';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import {
  statCount,
  statSum,
  statTotal,
  type TableStatsShape,
} from '@exyconn/shell/components/data/tableStats';
import { formatMoney } from '@exyconn/shell/utils/money';
import type { DealForecastQuery } from '@exyconn/shell/graphql/generated';

type Stats = TableStatsShape | null | undefined;

export interface CrmOverviewSource {
  leads: Stats;
  deals: Stats;
  companies: Stats;
  contacts: Stats;
  forecast: DealForecastQuery['dealForecast'] | undefined;
}

/** The buckets of one grouped count, or none while the query is still loading. */
const bucketsOf = (stats: Stats, field: string) =>
  stats?.counts.find((entry) => entry.field === field)?.buckets ?? [];

/** The tiles across the top: the funnel from lead to won deal, and the book of business. */
export function crmStatItems({
  leads,
  deals,
  companies,
  contacts,
  forecast,
}: CrmOverviewSource): StatItem[] {
  return [
    { label: 'Leads', value: String(statTotal(leads)), accent: '#4f8cff' },
    { label: 'Leads won', value: String(statCount(leads, 'stage', 'WON')), accent: '#22c55e' },
    { label: 'Companies', value: String(statTotal(companies)), accent: '#64748b' },
    { label: 'Contacts', value: String(statTotal(contacts)), accent: '#8b5cf6' },
    { label: 'Open deals', value: String(forecast?.openCount ?? 0), accent: '#4f8cff' },
    { label: 'Open pipeline', value: formatMoney(forecast?.openValue ?? 0), accent: '#f59e0b' },
    {
      label: 'Weighted forecast',
      value: formatMoney(forecast?.weightedValue ?? 0),
      accent: '#8b5cf6',
    },
    {
      label: 'Deals won',
      value: `${statCount(deals, 'stage', 'WON')} · ${formatMoney(statSum(deals, 'value'))} total`,
      accent: '#22c55e',
    },
  ];
}

/** How the leads and the deals spread across their stages, and where the leads came from. */
export function crmBreakdowns({ leads, deals }: CrmOverviewSource): OverviewBreakdown[] {
  return [
    { title: 'Leads by stage', buckets: bucketsOf(leads, 'stage'), accent: '#4f8cff' },
    { title: 'Deals by stage', buckets: bucketsOf(deals, 'stage'), accent: '#f59e0b' },
    { title: 'Leads by source', buckets: bucketsOf(leads, 'source'), accent: '#8b5cf6' },
  ];
}
