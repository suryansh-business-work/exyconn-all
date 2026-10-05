import { useState } from 'react';
import { CrudDashboard, usePagedFetcher } from '@exyconn/crud';
import { useT } from '@exyconn/i18n';
import { Button } from '@exyconn/shell/components/ui';
import AddIcon from '@mui/icons-material/Add';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  ClientHubTicketsDocument,
  type ClientHubTicketsQuery,
} from '@exyconn/shell/graphql/generated';
import { OpenTicketForm } from './forms/open-ticket';
import { TicketThreadDialog } from './TicketThreadDialog';
import { TICKET_COLUMNS, type ClientTicketRow, type TicketsGridContext } from './tickets-grid';

/** The client's support tickets: raise a new one, follow the replies, answer back. */
export function SupportPage() {
  const t = useT();
  const { formatDate } = useSettings();
  const [raising, setRaising] = useState(false);
  const [open, setOpen] = useState<ClientTicketRow | null>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const fetchRows = usePagedFetcher(
    ClientHubTicketsDocument,
    (data: ClientHubTicketsQuery) => data.clientHubTickets,
  );
  const gridContext: TicketsGridContext = { actions: { open: setOpen }, formatDate };

  const raised = () => {
    setRaising(false);
    setRefreshSignal((value) => value + 1);
  };

  return (
    <CrudDashboard
      title="Support"
      subtitle="Raise a ticket and follow every reply from our team"
      entityLabel="ticket"
      exportFileName="support-tickets"
      stats={[]}
      refreshSignal={refreshSignal}
      columnDefs={TICKET_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      onRowClick={setOpen}
      searchPlaceholder="Search by reference, subject or status…"
      toolbar={
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setRaising(true)}>
          {t('New ticket')}
        </Button>
      }
      extraDialogs={
        <>
          <CrudDialog
            open={raising}
            title={t('New support ticket')}
            onClose={() => setRaising(false)}
          >
            <OpenTicketForm onDone={raised} onCancel={() => setRaising(false)} />
          </CrudDialog>
          <TicketThreadDialog ticket={open} onClose={() => setOpen(null)} />
        </>
      }
    />
  );
}
