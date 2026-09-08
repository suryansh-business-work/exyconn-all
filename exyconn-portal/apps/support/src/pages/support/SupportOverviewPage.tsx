import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import {
  ModuleOverview,
  type OverviewBreakdown,
} from '@exyconn/shell/components/dashboard/ModuleOverview';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  FilterOp,
  SupportStatus,
  useListSupportTicketsPagedQuery,
  useListSupportTicketsStatsQuery,
  type ListSupportTicketsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { raisedBy } from './tickets-grid';

type TicketRow = ListSupportTicketsPagedQuery['listSupportTicketsPaged']['rows'][number];

/** How many tickets the overview lists before sending you to the console. */
const RECENT_TICKETS = 8;

/** Newest tickets nobody has started on yet. */
const OPEN_PAGE = {
  page: 0,
  pageSize: RECENT_TICKETS,
  filters: [{ field: 'status', op: FilterOp.Equals, value: SupportStatus.Open }],
};

/**
 * Support → Overview: how many tickets are waiting and what they are about. The
 * numbers come from one server aggregation; only the short list of open tickets
 * is fetched as rows.
 */
export function SupportOverviewPage() {
  const { data: statsData } = useListSupportTicketsStatsQuery({ fetchPolicy: 'cache-and-network' });
  const { data: openData, loading } = useListSupportTicketsPagedQuery({
    variables: { input: OPEN_PAGE },
    fetchPolicy: 'cache-and-network',
  });
  const { formatDate } = useSettings();

  const stats = statsData?.listSupportTicketsStats;
  const total = statTotal(stats);
  const open = statCount(stats, 'status', 'OPEN') + statCount(stats, 'status', 'IN_PROGRESS');

  const statItems: StatItem[] = [
    { label: 'Tickets', value: String(total), accent: '#4f8cff' },
    { label: 'Open', value: String(open), accent: '#f59e0b' },
    {
      label: 'High priority',
      value: String(statCount(stats, 'priority', 'HIGH')),
      accent: '#ff6b6b',
    },
    { label: 'Resolved', value: String(total - open), accent: '#22c55e' },
  ];

  const bucketsFor = (field: string) => stats?.counts.find((c) => c.field === field)?.buckets ?? [];
  const breakdowns: OverviewBreakdown[] = [
    { title: 'By status', buckets: bucketsFor('status'), accent: '#4f8cff' },
    { title: 'By category', buckets: bucketsFor('category'), accent: '#8b5cf6' },
  ];

  const columns: Column<TicketRow>[] = [
    { key: 'subject', label: 'Subject' },
    { key: 'raisedBy', label: 'Raised by', render: raisedBy },
    { key: 'priority', label: 'Priority', render: (r) => <StatusChip value={r.priority} /> },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
    { key: 'createdAt', label: 'Raised', render: (r) => formatDate(r.createdAt) },
  ];

  return (
    <ModuleOverview
      title="Support"
      subtitle="Tickets at a glance"
      stats={statItems}
      breakdowns={breakdowns}
      links={[{ label: 'Open ticket console', to: '/support/tickets' }]}
      recentTitle="Open tickets"
    >
      <DataTable
        columns={columns}
        rows={openData?.listSupportTicketsPaged.rows ?? []}
        emptyMessage={loading ? 'Loading…' : 'No open tickets.'}
      />
    </ModuleOverview>
  );
}
