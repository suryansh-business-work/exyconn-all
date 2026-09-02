import type { MouseEvent } from 'react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import { Flex, IconButton } from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import type { ListProjectsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedProjectRow = ListProjectsPagedQuery['listProjectsPaged']['rows'][number];

/** Page-level handlers ag-grid hands to the project cells via its `context`. */
export interface ProjectsGridContext {
  onEdit: (row: PagedProjectRow) => void;
  onDelete: (row: PagedProjectRow) => void;
  onOpenBoard: (row: PagedProjectRow) => void;
  formatDate: (value: string | null | undefined) => string;
}

function renderDate(ctx: ProjectsGridContext, value: string | null | undefined) {
  return <>{ctx.formatDate(value) || '—'}</>;
}

function StatusCell(params: Readonly<ICellRendererParams<PagedProjectRow>>) {
  if (!params.data) {
    return null;
  }
  return <StatusChip value={params.data.status} />;
}

function StartDateCell(params: Readonly<ICellRendererParams<PagedProjectRow>>) {
  const row = params.data;
  const ctx = params.context as ProjectsGridContext;
  if (!row) {
    return null;
  }
  return renderDate(ctx, row.startDate);
}

function EndDateCell(params: Readonly<ICellRendererParams<PagedProjectRow>>) {
  const row = params.data;
  const ctx = params.context as ProjectsGridContext;
  if (!row) {
    return null;
  }
  return renderDate(ctx, row.endDate);
}

function DescriptionCell(params: Readonly<ICellRendererParams<PagedProjectRow>>) {
  const row = params.data;
  if (!row) {
    return null;
  }
  return <>{row.description ?? '—'}</>;
}

function ProjectActionsCell(params: Readonly<ICellRendererParams<PagedProjectRow>>) {
  const row = params.data;
  const ctx = params.context as ProjectsGridContext;
  if (!row) {
    return null;
  }
  const run = (handler: (target: PagedProjectRow) => void) => (event: MouseEvent) => {
    event.stopPropagation();
    handler(row);
  };
  return (
    <Flex direction="row" spacing={0.25}>
      <IconButton
        size="small"
        color="primary"
        aria-label="open board"
        onClick={run(ctx.onOpenBoard)}
      >
        <ViewKanbanIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" aria-label="edit" onClick={run(ctx.onEdit)}>
        <EditIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" aria-label="delete" onClick={run(ctx.onDelete)}>
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Flex>
  );
}

/** Column model for the server-side Projects grid. Name/Description hit the server filter. */
export const PROJECT_COLUMNS: ColDef<PagedProjectRow>[] = [
  { field: 'name', headerName: 'Name' },
  {
    field: 'status',
    headerName: 'Status',
    cellRenderer: StatusCell,
    filter: false,
    floatingFilter: false,
  },
  {
    field: 'startDate',
    headerName: 'Start',
    cellRenderer: StartDateCell,
    filter: false,
    floatingFilter: false,
  },
  {
    field: 'endDate',
    headerName: 'End',
    cellRenderer: EndDateCell,
    filter: false,
    floatingFilter: false,
  },
  { field: 'description', headerName: 'Description', cellRenderer: DescriptionCell },
  {
    colId: 'actions',
    headerName: '',
    cellRenderer: ProjectActionsCell,
    sortable: false,
    filter: false,
    floatingFilter: false,
    flex: 0,
    width: 150,
    minWidth: 150,
  },
];
