import type { MouseEvent } from 'react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Flex, IconButton } from '@/components/ui';
import { StatusChip } from '../../../components/data/StatusChip';
import type { ListClientsPagedQuery } from '../../../graphql/generated';

export type PagedClientRow = ListClientsPagedQuery['listClientsPaged']['rows'][number];

/** Page-level handlers ag-grid hands to the client cells via its `context`. */
export interface ClientsGridContext {
  onEdit: (row: PagedClientRow) => void;
  onDelete: (row: PagedClientRow) => void;
}

function StatusCell(params: Readonly<ICellRendererParams<PagedClientRow>>) {
  if (!params.data) {
    return null;
  }
  return <StatusChip value={params.data.status} />;
}

function ClientActionsCell(params: Readonly<ICellRendererParams<PagedClientRow>>) {
  const row = params.data;
  const ctx = params.context as ClientsGridContext;
  if (!row) {
    return null;
  }
  const run = (handler: (target: PagedClientRow) => void) => (event: MouseEvent) => {
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

/** Column model for the server-side Clients grid. Name/company/email/phone hit the server filter. */
export const CLIENT_COLUMNS: ColDef<PagedClientRow>[] = [
  { field: 'name', headerName: 'Name' },
  { field: 'company', headerName: 'Company' },
  { field: 'email', headerName: 'Email' },
  { field: 'phone', headerName: 'Phone' },
  {
    field: 'status',
    headerName: 'Status',
    cellRenderer: StatusCell,
    filter: false,
    floatingFilter: false,
  },
  {
    colId: 'actions',
    headerName: '',
    cellRenderer: ClientActionsCell,
    sortable: false,
    filter: false,
    floatingFilter: false,
    flex: 0,
    width: 120,
    minWidth: 120,
  },
];
