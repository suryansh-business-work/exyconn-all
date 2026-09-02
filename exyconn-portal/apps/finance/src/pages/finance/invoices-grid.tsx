import type { MouseEvent } from 'react';
import type { ColDef, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Flex, IconButton } from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import type { ListInvoicesPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedInvoiceRow = ListInvoicesPagedQuery['listInvoicesPaged']['rows'][number];

/** Page-level handlers ag-grid hands to the invoice cells via its `context`. */
export interface InvoicesGridContext {
  onEdit: (row: PagedInvoiceRow) => void;
  onDelete: (row: PagedInvoiceRow) => void;
  formatDate: (value: string) => string;
}

function amountFormatter(params: ValueFormatterParams<PagedInvoiceRow>): string {
  const row = params.data;
  if (!row) {
    return '';
  }
  return `${row.currency} ${row.amount.toLocaleString()}`;
}

function StatusCell(params: Readonly<ICellRendererParams<PagedInvoiceRow>>) {
  if (!params.data) {
    return null;
  }
  return <StatusChip value={params.data.status} />;
}

function DueDateCell(params: Readonly<ICellRendererParams<PagedInvoiceRow>>) {
  const row = params.data;
  const ctx = params.context as InvoicesGridContext;
  if (!row) {
    return null;
  }
  return <>{ctx.formatDate(row.dueDate)}</>;
}

function InvoiceActionsCell(params: Readonly<ICellRendererParams<PagedInvoiceRow>>) {
  const row = params.data;
  const ctx = params.context as InvoicesGridContext;
  if (!row) {
    return null;
  }
  const run = (handler: (target: PagedInvoiceRow) => void) => (event: MouseEvent) => {
    event.stopPropagation();
    handler(row);
  };
  return (
    <Flex direction="row" spacing={0.25}>
      <IconButton size="small" aria-label="edit" onClick={run(ctx.onEdit)}>
        <EditIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" aria-label="delete" onClick={run(ctx.onDelete)}>
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Flex>
  );
}

/** Column model for the server-side Invoices grid. Number/Client hit the server filter. */
export const INVOICE_COLUMNS: ColDef<PagedInvoiceRow>[] = [
  { field: 'number', headerName: 'Number' },
  { field: 'clientId', headerName: 'Client' },
  {
    field: 'amount',
    headerName: 'Amount',
    valueFormatter: amountFormatter,
    filter: false,
    floatingFilter: false,
  },
  {
    field: 'status',
    headerName: 'Status',
    cellRenderer: StatusCell,
    filter: false,
    floatingFilter: false,
  },
  {
    field: 'dueDate',
    headerName: 'Due',
    cellRenderer: DueDateCell,
    filter: false,
    floatingFilter: false,
  },
  {
    colId: 'actions',
    headerName: '',
    cellRenderer: InvoiceActionsCell,
    sortable: false,
    filter: false,
    floatingFilter: false,
    flex: 0,
    width: 120,
    minWidth: 120,
  },
];
