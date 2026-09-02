import type { MouseEvent } from 'react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Flex, IconButton } from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import type { ListJobsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedJobRow = ListJobsPagedQuery['listJobsPaged']['rows'][number];

/** Page-level handlers ag-grid hands to the job cells via its `context`. */
export interface JobsGridContext {
  onEdit: (row: PagedJobRow) => void;
  onDelete: (row: PagedJobRow) => void;
}

function StatusCell(params: Readonly<ICellRendererParams<PagedJobRow>>) {
  if (!params.data) {
    return null;
  }
  return <StatusChip value={params.data.isActive ? 'ACTIVE' : 'INACTIVE'} />;
}

function JobActionsCell(params: Readonly<ICellRendererParams<PagedJobRow>>) {
  const row = params.data;
  const ctx = params.context as JobsGridContext;
  if (!row) {
    return null;
  }
  const run = (handler: (target: PagedJobRow) => void) => (event: MouseEvent) => {
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

/** Column model for the server-side Jobs grid. Text columns hit the server filter. */
export const JOB_COLUMNS: ColDef<PagedJobRow>[] = [
  { field: 'title', headerName: 'Title' },
  { field: 'jobCode', headerName: 'Code' },
  { field: 'companySlug', headerName: 'Company' },
  { field: 'category', headerName: 'Category' },
  { field: 'jobType', headerName: 'Type' },
  { field: 'workMode', headerName: 'Work mode' },
  {
    field: 'isActive',
    headerName: 'Status',
    cellRenderer: StatusCell,
    filter: false,
    floatingFilter: false,
  },
  {
    colId: 'actions',
    headerName: '',
    cellRenderer: JobActionsCell,
    sortable: false,
    filter: false,
    floatingFilter: false,
    flex: 0,
    width: 120,
    minWidth: 120,
  },
];
