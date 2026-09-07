import type { ColDef } from 'ag-grid-community';
import DownloadIcon from '@mui/icons-material/Download';
import SendIcon from '@mui/icons-material/Send';
import {
  DELETE_ACTION,
  EDIT_ACTION,
  actionsColumn,
  dateColumn,
  statusColumn,
  textColumn,
  valueColumn,
  type DatedCrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import type { ListInvoicesPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedInvoiceRow = ListInvoicesPagedQuery['listInvoicesPaged']['rows'][number];

/** Row handlers and date formatting ag-grid hands to the shared cells via its `context`. */
export type InvoicesGridContext = DatedCrudGridContext<PagedInvoiceRow>;

const DOWNLOAD_ACTION: RowActionSpec = {
  key: 'download',
  label: 'download PDF',
  icon: DownloadIcon,
  color: 'inherit',
};

const SEND_ACTION: RowActionSpec = {
  key: 'send',
  label: 'send to client',
  icon: SendIcon,
  color: 'primary',
};

/** Column model for the server-side Invoices grid. Number/Client hit the server filter. */
export const INVOICE_COLUMNS: ColDef<PagedInvoiceRow>[] = [
  textColumn('number', 'Number'),
  textColumn('clientName', 'Client', (row) => row.clientName || row.clientId),
  valueColumn('amount', 'Amount', (row) => `${row.currency} ${row.amount.toLocaleString()}`),
  // Written by the payments ledger, never by the invoice form — see finance.billing.ts.
  valueColumn('amountPaid', 'Paid', (row) => `${row.currency} ${row.amountPaid.toLocaleString()}`),
  valueColumn(
    'balanceDue',
    'Balance',
    (row) => `${row.currency} ${row.balanceDue.toLocaleString()}`,
  ),
  statusColumn('status', 'Status'),
  dateColumn('dueDate', 'Due'),
  dateColumn('sentAt', 'Sent', '—'),
  actionsColumn([DOWNLOAD_ACTION, SEND_ACTION, EDIT_ACTION, DELETE_ACTION]),
];
