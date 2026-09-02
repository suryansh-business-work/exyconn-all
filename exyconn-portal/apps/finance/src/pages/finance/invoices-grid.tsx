import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  dateColumn,
  statusColumn,
  textColumn,
  valueColumn,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import type { ListInvoicesPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedInvoiceRow = ListInvoicesPagedQuery['listInvoicesPaged']['rows'][number];

/** Row handlers and date formatting ag-grid hands to the shared cells via its `context`. */
export type InvoicesGridContext = DatedCrudGridContext<PagedInvoiceRow>;

/** Column model for the server-side Invoices grid. Number/Client hit the server filter. */
export const INVOICE_COLUMNS: ColDef<PagedInvoiceRow>[] = [
  textColumn('number', 'Number'),
  textColumn('clientId', 'Client'),
  valueColumn('amount', 'Amount', (row) => `${row.currency} ${row.amount.toLocaleString()}`),
  statusColumn('status', 'Status'),
  dateColumn('dueDate', 'Due'),
  actionsColumn(),
];
