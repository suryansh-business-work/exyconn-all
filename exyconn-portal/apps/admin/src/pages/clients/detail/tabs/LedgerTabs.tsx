import type { ColDef } from 'ag-grid-community';
import { CrudDashboard, usePagedFetcher, type DatedCrudGridContext } from '@exyconn/crud';
import type { GridFetcher } from '@exyconn/shell/components/data/ServerDataGrid';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  ListInvoicesPagedDocument,
  ListPaymentsPagedDocument,
  ListSupportTicketsPagedDocument,
  type ListInvoicesPagedQuery,
  type ListPaymentsPagedQuery,
  type ListSupportTicketsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { clientFilter } from './clientFilter';
import {
  INVOICE_COLUMNS,
  PAYMENT_COLUMNS,
  TICKET_COLUMNS,
  type ClientInvoiceRow,
  type ClientPaymentRow,
  type ClientTicketRow,
} from './ledger-grids';

interface ClientTabProps {
  clientId: string;
}

interface ReadOnlyGridProps<TRow> {
  title: string;
  subtitle: string;
  entityLabel: string;
  columnDefs: ColDef<TRow>[];
  fetchRows: GridFetcher<TRow>;
}

/** A read-only, server-paged list of one client's records, as its own module lists them. */
function ReadOnlyGrid<TRow>({
  title,
  subtitle,
  entityLabel,
  columnDefs,
  fetchRows,
}: Readonly<ReadOnlyGridProps<TRow>>) {
  const { formatDate } = useSettings();
  const context: DatedCrudGridContext<TRow> = { actions: {}, formatDate };
  return (
    <CrudDashboard<TRow, TRow>
      title={title}
      subtitle={subtitle}
      entityLabel={entityLabel}
      stats={[]}
      columnDefs={columnDefs}
      fetchRows={fetchRows}
      context={context}
      searchPlaceholder="Search…"
    />
  );
}

/** Every invoice raised to the client, drafts included (the hub shows only sent ones). */
export function InvoicesTab({ clientId }: Readonly<ClientTabProps>) {
  const fetchRows = usePagedFetcher(
    ListInvoicesPagedDocument,
    (data: ListInvoicesPagedQuery) => data.listInvoicesPaged,
    clientFilter(clientId),
  );
  return (
    <ReadOnlyGrid<ClientInvoiceRow>
      title="Invoices"
      subtitle="Raised in Finance; the client pays them in the client hub"
      entityLabel="invoice"
      columnDefs={INVOICE_COLUMNS}
      fetchRows={fetchRows}
    />
  );
}

export function PaymentsTab({ clientId }: Readonly<ClientTabProps>) {
  const fetchRows = usePagedFetcher(
    ListPaymentsPagedDocument,
    (data: ListPaymentsPagedQuery) => data.listPaymentsPaged,
    clientFilter(clientId),
  );
  return (
    <ReadOnlyGrid<ClientPaymentRow>
      title="Payments"
      subtitle="Every payment received from the client"
      entityLabel="payment"
      columnDefs={PAYMENT_COLUMNS}
      fetchRows={fetchRows}
    />
  );
}

export function TicketsTab({ clientId }: Readonly<ClientTabProps>) {
  const fetchRows = usePagedFetcher(
    ListSupportTicketsPagedDocument,
    (data: ListSupportTicketsPagedQuery) => data.listSupportTicketsPaged,
    clientFilter(clientId),
  );
  return (
    <ReadOnlyGrid<ClientTicketRow>
      title="Support tickets"
      subtitle="Tickets the client raised; answer them in the Support portal"
      entityLabel="ticket"
      columnDefs={TICKET_COLUMNS}
      fetchRows={fetchRows}
    />
  );
}
