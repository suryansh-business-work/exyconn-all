import type { MouseEvent } from 'react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Flex, IconButton } from '@/components/ui';
import { StatusChip } from '../../../components/data/StatusChip';
import type { ListGigsPagedQuery } from '../../../graphql/generated';

export type PagedGigRow = ListGigsPagedQuery['listGigsPaged']['rows'][number];

/** Page-level handlers ag-grid hands to the gig cells via its `context`. */
export interface GigsGridContext {
  onEdit: (row: PagedGigRow) => void;
  onDelete: (row: PagedGigRow) => void;
  formatDate: (value: string) => string;
}

function StatusCell(params: Readonly<ICellRendererParams<PagedGigRow>>) {
  if (!params.data) {
    return null;
  }
  return <StatusChip value={params.data.status} />;
}

function PostedCell(params: Readonly<ICellRendererParams<PagedGigRow>>) {
  const row = params.data;
  const ctx = params.context as GigsGridContext;
  if (!row) {
    return null;
  }
  return <>{ctx.formatDate(row.postedDate)}</>;
}

function GigActionsCell(params: Readonly<ICellRendererParams<PagedGigRow>>) {
  const row = params.data;
  const ctx = params.context as GigsGridContext;
  if (!row) {
    return null;
  }
  const run = (handler: (target: PagedGigRow) => void) => (event: MouseEvent) => {
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

/** Column model for the server-side Gigs grid. Title/Code/Category/Budget hit the server filter. */
export const GIG_COLUMNS: ColDef<PagedGigRow>[] = [
  { field: 'title', headerName: 'Title' },
  { field: 'gigCode', headerName: 'Code' },
  { field: 'category', headerName: 'Category' },
  { field: 'budget', headerName: 'Budget' },
  {
    field: 'status',
    headerName: 'Status',
    cellRenderer: StatusCell,
    filter: false,
    floatingFilter: false,
  },
  {
    field: 'postedDate',
    headerName: 'Posted',
    cellRenderer: PostedCell,
    filter: false,
    floatingFilter: false,
  },
  {
    colId: 'actions',
    headerName: '',
    cellRenderer: GigActionsCell,
    sortable: false,
    filter: false,
    floatingFilter: false,
    flex: 0,
    width: 120,
    minWidth: 120,
  },
];
