import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import {
  ModuleOverview,
  type OverviewBreakdown,
} from '@exyconn/shell/components/dashboard/ModuleOverview';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  SupportPriority,
  useListSupportTicketsQuery,
  type ListSupportTicketsQuery,
} from '@exyconn/shell/graphql/generated';
import { OPEN_TICKET_STATUSES } from './support.constants';

type TicketRow = ListSupportTicketsQuery['listSupportTickets'][number];

/** How many tickets the overview lists before sending you to the console. */
const RECENT_TICKETS = 8;

/** Counts rows per value of one field, for the breakdown bars. */
function bucketsOf(rows: TicketRow[], pick: (row: TicketRow) => string) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = pick(row);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts].map(([value, count]) => ({ value, count }));
}

/**
 * Support → Overview: how many tickets are waiting and what they are about.
 * The counts are computed here rather than server-side, because the support
 * module exposes the ticket list and no aggregation.
 */
export function SupportOverviewPage() {
  const { data, loading } = useListSupportTicketsQuery({ fetchPolicy: 'cache-and-network' });
  const { formatDate } = useSettings();

  const tickets = data?.listSupportTickets ?? [];
  const open = tickets.filter((t) => OPEN_TICKET_STATUSES.has(t.status));
  const urgent = open.filter((t) => t.priority === SupportPriority.High);

  const statItems: StatItem[] = [
    { label: 'Tickets', value: String(tickets.length), accent: '#4f8cff' },
    { label: 'Open', value: String(open.length), accent: '#f59e0b' },
    { label: 'High priority', value: String(urgent.length), accent: '#ff6b6b' },
    { label: 'Resolved', value: String(tickets.length - open.length), accent: '#22c55e' },
  ];

  const breakdowns: OverviewBreakdown[] = [
    { title: 'By status', buckets: bucketsOf(tickets, (t) => t.status), accent: '#4f8cff' },
    { title: 'By category', buckets: bucketsOf(tickets, (t) => t.category), accent: '#8b5cf6' },
  ];

  const columns: Column<TicketRow>[] = [
    { key: 'subject', label: 'Subject' },
    { key: 'employeeName', label: 'Raised by' },
    { key: 'priority', label: 'Priority', render: (r) => <StatusChip value={r.priority} /> },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
    { key: 'createdAt', label: 'Raised', render: (r) => formatDate(r.createdAt) },
  ];

  const rows = urgent.length > 0 ? urgent : open;

  return (
    <ModuleOverview
      title="Support"
      subtitle="Tickets at a glance"
      stats={statItems}
      breakdowns={breakdowns}
      links={[{ label: 'Open ticket console', to: '/support/tickets' }]}
      recentTitle={urgent.length > 0 ? 'Needs attention first' : 'Open tickets'}
    >
      <DataTable
        columns={columns}
        rows={rows.slice(0, RECENT_TICKETS)}
        emptyMessage={loading ? 'Loading…' : 'No open tickets.'}
      />
    </ModuleOverview>
  );
}
