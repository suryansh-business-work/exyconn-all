import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CrudDashboard, usePagedFetcher } from '@exyconn/crud';
import { useAuth } from '@exyconn/shell/auth/AuthContext';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { color } from '@exyconn/shell/components/ui';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  EMPLOYEE_DESK_FILTERS,
  TicketDetailDialog,
  TicketQuickFilter,
  quickFilters,
  type QuickFilter,
} from '@exyconn/shell/pages/ticket-desk';
import {
  FilterOp,
  ListSupportTicketsPagedDocument,
  SupportCategory,
  useItDashboardQuery,
  useItSettingsQuery,
  useSupportSlaSummaryQuery,
  type ListSupportTicketsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { HELPDESK_COLUMNS, type HelpdeskGridContext, type PagedItTicketRow } from './helpdesk-grid';

/** IT works the IT category of the shared queue; the server enforces it for IT staff too. */
const IT_ONLY = [{ field: 'category', op: FilterOp.Equals, value: SupportCategory.It }];

/**
 * IT › Helpdesk: the IT tickets employees raise, triaged by IT's own topics, assigned to IT
 * staff, held to the SLA policies and escalated when they need to be. The ticket view is the
 * same one the Support console uses.
 */
export function HelpdeskPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatDate } = useSettings();
  const [quick, setQuick] = useState<QuickFilter>('all');
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [viewing, setViewing] = useState<PagedItTicketRow | null>(null);
  const { data: dashboard, refetch: refetchDashboard } = useItDashboardQuery();
  const { data: sla } = useSupportSlaSummaryQuery();
  const { data: settings } = useItSettingsQuery();
  const fetchRows = usePagedFetcher(
    ListSupportTicketsPagedDocument,
    (data: ListSupportTicketsPagedQuery) => data.listSupportTicketsPaged,
    [...IT_ONLY, ...quickFilters(quick, user?.id ?? '')],
  );

  const reload = () => {
    setRefreshSignal((signal) => signal + 1);
    refetchDashboard().catch((error: unknown) => console.error('Could not refresh tiles', error));
  };

  const counts = dashboard?.itDashboard;
  const statItems: StatItem[] = [
    { label: 'Open tickets', value: String(counts?.openTickets ?? 0), accent: color.cyan[600] },
    {
      label: 'Unassigned',
      value: String(counts?.unassignedTickets ?? 0),
      accent: color.amber[500],
    },
    { label: 'Overdue', value: String(counts?.overdueTickets ?? 0), accent: color.red[500] },
    {
      label: 'Due soon',
      value: String(sla?.supportSlaSummary.dueSoon ?? 0),
      accent: color.violet[400],
    },
  ];

  const gridContext: HelpdeskGridContext = {
    actions: {
      open: setViewing,
      page: (row) => navigate(`/it/helpdesk/${row.id}`),
    },
    formatDate,
  };

  return (
    <CrudDashboard
      title="IT Helpdesk"
      subtitle="IT issues raised by employees — priority, SLA, assignment, comments and escalation"
      entityLabel="ticket"
      exportFileName="it-tickets"
      stats={statItems}
      refreshSignal={refreshSignal}
      columnDefs={HELPDESK_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by subject, reference or assignee…"
      onRowClick={setViewing}
      toolbar={
        <TicketQuickFilter
          value={quick}
          only={EMPLOYEE_DESK_FILTERS}
          onChange={(next) => {
            setQuick(next);
            reload();
          }}
        />
      }
      extraDialogs={
        <TicketDetailDialog
          ticket={viewing}
          topics={settings?.itSettings.ticketTopics}
          onClose={() => setViewing(null)}
          onChanged={reload}
        />
      }
    />
  );
}
