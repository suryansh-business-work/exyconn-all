import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { formatMoney } from '@exyconn/shell/utils/money';
import { color } from '@exyconn/shell/components/ui';
import type { CrmDashboardQuery } from '@exyconn/shell/graphql/generated';

type Kpis = CrmDashboardQuery['crmDashboard']['kpis'];

/** A share as a whole percent, or a dash when there is nothing to divide. */
export const percentOf = (rate: number | null | undefined): string =>
  rate === null || rate === undefined ? '—' : `${Math.round(rate * 100)}%`;

/** The two rows of tiles: the money first, then the work coming in and the work left over. */
export function dashboardTiles(kpis: Kpis): StatItem[] {
  return [
    {
      label: 'Open pipeline',
      value: formatMoney(kpis.openPipelineValue),
      accent: color.amber[500],
    },
    { label: 'Won this period', value: formatMoney(kpis.wonValue), accent: color.green[500] },
    {
      label: 'Deals won (win rate)',
      value: `${kpis.wonCount} (${percentOf(kpis.winRate)})`,
      accent: color.green[500],
    },
    { label: 'Meetings booked', value: String(kpis.meetingsBooked), accent: color.violet[400] },
    { label: 'New leads', value: String(kpis.newLeads), accent: color.blue[400] },
    { label: 'New contacts', value: String(kpis.newContacts), accent: color.blue[400] },
    { label: 'New companies', value: String(kpis.newCompanies), accent: color.slate[500] },
    {
      label: 'Overdue tasks & reminders',
      value: String(kpis.overdueTasks + kpis.overdueReminders),
      accent: color.red[500],
    },
  ];
}
