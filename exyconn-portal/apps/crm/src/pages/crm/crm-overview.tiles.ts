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
import { color } from '@exyconn/shell/components/ui';

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
    { label: 'Leads', value: String(statTotal(leads)), accent: color.blue[400] },
    {
      label: 'Leads won',
      value: String(statCount(leads, 'stage', 'WON')),
      accent: color.green[500],
    },
    { label: 'Companies', value: String(statTotal(companies)), accent: color.slate[500] },
    { label: 'Contacts', value: String(statTotal(contacts)), accent: color.violet[400] },
    { label: 'Open deals', value: String(forecast?.openCount ?? 0), accent: color.blue[400] },
    {
      label: 'Open pipeline',
      value: formatMoney(forecast?.openValue ?? 0),
      accent: color.amber[500],
    },
    {
      label: 'Weighted forecast',
      value: formatMoney(forecast?.weightedValue ?? 0),
      accent: color.violet[400],
    },
    {
      label: 'Deals won',
      value: `${statCount(deals, 'stage', 'WON')} · ${formatMoney(statSum(deals, 'value'))} total`,
      accent: color.green[500],
    },
  ];
}

/** How the leads and the deals spread across their stages, and where the leads came from. */
export function crmBreakdowns({ leads, deals }: CrmOverviewSource): OverviewBreakdown[] {
  return [
    { title: 'Leads by stage', buckets: bucketsOf(leads, 'stage'), accent: color.blue[400] },
    { title: 'Deals by stage', buckets: bucketsOf(deals, 'stage'), accent: color.amber[500] },
    { title: 'Leads by source', buckets: bucketsOf(leads, 'source'), accent: color.violet[400] },
  ];
}
