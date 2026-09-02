import type { MouseEvent } from 'react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import { Flex, IconButton } from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import type { ListContractsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedContractRow = ListContractsPagedQuery['listContractsPaged']['rows'][number];

/** Page-level handlers ag-grid hands to the contract cells via its `context`. */
export interface ContractsGridContext {
  onEdit: (row: PagedContractRow) => void;
  onSend: (row: PagedContractRow) => void;
  onDelete: (row: PagedContractRow) => void;
  formatDate: (value: string) => string;
}

function TypeCell(params: Readonly<ICellRendererParams<PagedContractRow>>) {
  if (!params.data) {
    return null;
  }
  return <StatusChip value={params.data.type} />;
}

function StatusCell(params: Readonly<ICellRendererParams<PagedContractRow>>) {
  if (!params.data) {
    return null;
  }
  return <StatusChip value={params.data.status} />;
}

function ExpiryDateCell(params: Readonly<ICellRendererParams<PagedContractRow>>) {
  const row = params.data;
  const ctx = params.context as ContractsGridContext;
  if (!row) {
    return null;
  }
  return <>{ctx.formatDate(row.expiryDate)}</>;
}

function SentAtCell(params: Readonly<ICellRendererParams<PagedContractRow>>) {
  const row = params.data;
  const ctx = params.context as ContractsGridContext;
  if (!row) {
    return null;
  }
  return <>{row.sentAt ? ctx.formatDate(row.sentAt) : '—'}</>;
}

function ContractActionsCell(params: Readonly<ICellRendererParams<PagedContractRow>>) {
  const row = params.data;
  const ctx = params.context as ContractsGridContext;
  if (!row) {
    return null;
  }
  const run = (handler: (target: PagedContractRow) => void) => (event: MouseEvent) => {
    event.stopPropagation();
    handler(row);
  };
  return (
    <Flex direction="row" spacing={0.25}>
      <IconButton size="small" aria-label="edit" onClick={run(ctx.onEdit)}>
        <EditIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" aria-label="send contract" color="primary" onClick={run(ctx.onSend)}>
        <SendIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" aria-label="delete" onClick={run(ctx.onDelete)}>
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Flex>
  );
}

/** Column model for the server-side Contracts grid. Title/Party hit the server filter. */
export const CONTRACT_COLUMNS: ColDef<PagedContractRow>[] = [
  { field: 'title', headerName: 'Title' },
  { field: 'party', headerName: 'Party' },
  {
    field: 'type',
    headerName: 'Type',
    cellRenderer: TypeCell,
    filter: false,
    floatingFilter: false,
  },
  {
    field: 'expiryDate',
    headerName: 'Expires',
    cellRenderer: ExpiryDateCell,
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
    field: 'sentAt',
    headerName: 'Sent',
    cellRenderer: SentAtCell,
    filter: false,
    floatingFilter: false,
  },
  {
    colId: 'actions',
    headerName: '',
    cellRenderer: ContractActionsCell,
    sortable: false,
    filter: false,
    floatingFilter: false,
    flex: 0,
    width: 150,
    minWidth: 150,
  },
];
