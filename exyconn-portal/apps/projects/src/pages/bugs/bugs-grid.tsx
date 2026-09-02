import type { MouseEvent } from 'react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Flex, IconButton } from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import type { ListBugsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedBugRow = ListBugsPagedQuery['listBugsPaged']['rows'][number];

/** Page-level handlers ag-grid hands to the bug cells via its `context`. */
export interface BugsGridContext {
  onEdit: (row: PagedBugRow) => void;
  onDelete: (row: PagedBugRow) => void;
  formatDate: (value: string) => string;
}

function SeverityCell(params: Readonly<ICellRendererParams<PagedBugRow>>) {
  if (!params.data) {
    return null;
  }
  return <StatusChip value={params.data.severity} />;
}

function StatusCell(params: Readonly<ICellRendererParams<PagedBugRow>>) {
  if (!params.data) {
    return null;
  }
  return <StatusChip value={params.data.status} />;
}

function DueDateCell(params: Readonly<ICellRendererParams<PagedBugRow>>) {
  const row = params.data;
  const ctx = params.context as BugsGridContext;
  if (!row) {
    return null;
  }
  return <>{ctx.formatDate(row.dueDate)}</>;
}

function BugActionsCell(params: Readonly<ICellRendererParams<PagedBugRow>>) {
  const row = params.data;
  const ctx = params.context as BugsGridContext;
  if (!row) {
    return null;
  }
  const run = (handler: (target: PagedBugRow) => void) => (event: MouseEvent) => {
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

/** Column model for the server-side Bugs grid. Title/Assignee hit the server filter. */
export const BUG_COLUMNS: ColDef<PagedBugRow>[] = [
  { field: 'title', headerName: 'Title' },
  { field: 'assignee', headerName: 'Assignee' },
  {
    field: 'severity',
    headerName: 'Severity',
    cellRenderer: SeverityCell,
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
    cellRenderer: BugActionsCell,
    sortable: false,
    filter: false,
    floatingFilter: false,
    flex: 0,
    width: 120,
    minWidth: 120,
  },
];
