import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CrudDashboard, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useAuth } from '@exyconn/shell/auth/AuthContext';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { Button, Flex, color } from '@exyconn/shell/components/ui';
import { CrudFormPage } from '@exyconn/shell/components/data/CrudFormPage';
import AddIcon from '@mui/icons-material/Add';
import {
  ListSupportTicketsPagedDocument,
  useListSupportTicketsStatsQuery,
  useSupportSlaSummaryQuery,
  type ListSupportTicketsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { TicketStatusDialog, type StatusTicket } from './TicketStatusDialog';
import { TicketDetailDialog } from './TicketDetailDialog';
import type { DetailTicket } from './TicketDetailBody';
import { TicketQuickFilter, quickFilters, type QuickFilter } from './TicketQuickFilter';
import { ClientTicketForm } from './forms/client-ticket';
import { TICKET_COLUMNS, type PagedTicketRow, type TicketsGridContext } from './tickets-grid';

/**
 * Support-team console: every ticket — employee and customer — who owns it, and the
 * conversation on it. The grid is server-paged; the quick filters above it add a server
 * filter to every page request. Status changes stay in their own small dialog; opening a
 * ticket is the fuller view, and each row also links to that view's own page.
 */
export function SupportConsolePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { formatDate } = useSettings();
  const { data: statsData, refetch: refetchStats } = useListSupportTicketsStatsQuery();
  const { data: slaData, refetch: refetchSla } = useSupportSlaSummaryQuery({
    fetchPolicy: 'cache-and-network',
  });
  const [quick, setQuick] = useState<QuickFilter>('all');
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [selected, setSelected] = useState<StatusTicket | null>(null);
  const [opened, setOpened] = useState<DetailTicket | null>(null);
  const [raising, setRaising] = useState(false);

  const fetchRows = usePagedFetcher(
    ListSupportTicketsPagedDocument,
    (data: ListSupportTicketsPagedQuery) => data.listSupportTicketsPaged,
    quickFilters(quick, user?.id ?? ''),
  );

  const reload = () => {
    setRefreshSignal((signal) => signal + 1);
    refetchStats().catch(() => undefined);
    refetchSla().catch(() => undefined);
  };

  const changeQuick = (next: QuickFilter) => {
    setQuick(next);
    setRefreshSignal((signal) => signal + 1);
  };

  const stats = statsData?.listSupportTicketsStats;
  const statItems: StatItem[] = [
    { label: 'Tickets', value: String(statTotal(stats)), accent: color.blue[400] },
    { label: 'Open', value: String(statCount(stats, 'status', 'OPEN')), accent: color.amber[500] },
    {
      label: 'In progress',
      value: String(statCount(stats, 'status', 'IN_PROGRESS')),
      accent: color.violet[400],
    },
    {
      label: 'High priority',
      value: String(statCount(stats, 'priority', 'HIGH')),
      accent: color.red[200],
    },
    {
      label: 'SLA breached',
      value: String(slaData?.supportSlaSummary.breached ?? 0),
      accent: color.rose[500],
    },
  ];

  const gridContext: TicketsGridContext = {
    actions: {
      open: (row: PagedTicketRow) => setOpened(row),
      page: (row: PagedTicketRow) => navigate(`/support/tickets/${row.id}`),
      status: (row: PagedTicketRow) =>
        setSelected({ id: row.id, subject: row.subject, status: row.status }),
    },
    formatDate,
  };

  if (raising) {
    return (
      <CrudFormPage
        title="Raise a customer ticket"
        onBack={() => setRaising(false)}
        backLabel="Back to Support"
      >
        <ClientTicketForm
          onCancel={() => setRaising(false)}
          onDone={() => {
            setRaising(false);
            reload();
          }}
        />
      </CrudFormPage>
    );
  }

  return (
    <CrudDashboard<PagedTicketRow, PagedTicketRow>
      title="Support"
      subtitle="Employee & customer tickets"
      entityLabel="ticket"
      stats={statItems}
      refreshSignal={refreshSignal}
      columnDefs={TICKET_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by subject, requester, reference or assignee…"
      toolbar={
        <Flex direction="row" justifyContent="space-between" alignItems="center" sx={{ gap: 1 }}>
          <TicketQuickFilter value={quick} onChange={changeQuick} />
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setRaising(true)}
          >
            New customer ticket
          </Button>
        </Flex>
      }
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
