import { useState } from 'react';
import { CrudDashboard, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useAuth } from '@exyconn/shell/auth/AuthContext';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  ListSupportTicketsPagedDocument,
  useListSupportTicketsStatsQuery,
  type ListSupportTicketsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { TicketStatusDialog, type StatusTicket } from './TicketStatusDialog';
import { TicketDetailDialog, type DetailTicket } from './TicketDetailDialog';
import { TicketQuickFilter, quickFilters, type QuickFilter } from './TicketQuickFilter';
import { TICKET_COLUMNS, type PagedTicketRow, type TicketsGridContext } from './tickets-grid';

/**
 * Support-team console: every employee ticket, who owns it, and the conversation
 * on it. The grid is server-paged; the quick filters above it add a server filter
 * to every page request. Status changes stay in their own small dialog; opening a
 * ticket is the fuller view.
 */
export function SupportConsolePage() {
  const { user } = useAuth();
  const { formatDate } = useSettings();
  const { data: statsData, refetch: refetchStats } = useListSupportTicketsStatsQuery();
  const [quick, setQuick] = useState<QuickFilter>('all');
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [selected, setSelected] = useState<StatusTicket | null>(null);
  const [opened, setOpened] = useState<DetailTicket | null>(null);

  const fetchRows = usePagedFetcher(
    ListSupportTicketsPagedDocument,
    (data: ListSupportTicketsPagedQuery) => data.listSupportTicketsPaged,
    quickFilters(quick, user?.id ?? ''),
  );

  const reload = () => {
    setRefreshSignal((signal) => signal + 1);
    refetchStats().catch(() => undefined);
  };

  const changeQuick = (next: QuickFilter) => {
    setQuick(next);
    setRefreshSignal((signal) => signal + 1);
  };

  const stats = statsData?.listSupportTicketsStats;
  const statItems: StatItem[] = [
    { label: 'Tickets', value: String(statTotal(stats)), accent: '#4f8cff' },
    { label: 'Open', value: String(statCount(stats, 'status', 'OPEN')), accent: '#f59e0b' },
    {
      label: 'In progress',
      value: String(statCount(stats, 'status', 'IN_PROGRESS')),
      accent: '#8b5cf6',
    },
    {
      label: 'High priority',
      value: String(statCount(stats, 'priority', 'HIGH')),
      accent: '#ff6b6b',
    },
  ];

  const gridContext: TicketsGridContext = {
    actions: {
      open: (row: PagedTicketRow) => setOpened(row),
      status: (row: PagedTicketRow) =>
        setSelected({ id: row.id, subject: row.subject, status: row.status }),
    },
    formatDate,
  };

  return (
    <CrudDashboard<PagedTicketRow, PagedTicketRow>
      title="Support"
      subtitle="Employee support tickets"
      entityLabel="ticket"
      stats={statItems}
      refreshSignal={refreshSignal}
      columnDefs={TICKET_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by subject, description or assignee…"
      toolbar={<TicketQuickFilter value={quick} onChange={changeQuick} />}
      extraDialogs={
        <>
          <TicketDetailDialog ticket={opened} onClose={() => setOpened(null)} onChanged={reload} />
          <TicketStatusDialog
            ticket={selected}
            onClose={() => setSelected(null)}
            onSaved={() => {
              reload();
              setSelected(null);
            }}
          />
        </>
      }
    />
  );
}
