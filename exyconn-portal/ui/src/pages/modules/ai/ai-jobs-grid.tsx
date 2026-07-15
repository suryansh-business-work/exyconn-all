import type { MouseEvent } from 'react';
import type { ColDef, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Flex, IconButton } from '@/components/ui';
import { StatusChip } from '../../../components/data/StatusChip';
import type { ListAiJobsPagedQuery } from '../../../graphql/generated';

export type PagedAiJobRow = ListAiJobsPagedQuery['listAiJobsPaged']['rows'][number];

/** Page-level handlers ag-grid hands to the AI-job cells via its `context`. */
export interface AiJobsGridContext {
  onEdit: (row: PagedAiJobRow) => void;
  onDelete: (row: PagedAiJobRow) => void;
}

function promptFormatter(params: ValueFormatterParams<PagedAiJobRow>): string {
  const row = params.data;
  if (!row) {
    return '';
  }
  return row.prompt.slice(0, 48);
}

function StatusCell(params: Readonly<ICellRendererParams<PagedAiJobRow>>) {
  if (!params.data) {
    return null;
  }
  return <StatusChip value={params.data.status} />;
}

function AiJobActionsCell(params: Readonly<ICellRendererParams<PagedAiJobRow>>) {
  const row = params.data;
  const ctx = params.context as AiJobsGridContext;
  if (!row) {
    return null;
  }
  const run = (handler: (target: PagedAiJobRow) => void) => (event: MouseEvent) => {
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

/** Column model for the server-side AI Jobs grid. Name/Model/Prompt hit the server filter. */
export const AI_JOB_COLUMNS: ColDef<PagedAiJobRow>[] = [
  { field: 'name', headerName: 'Name' },
  { field: 'model', headerName: 'Model' },
  { field: 'prompt', headerName: 'Prompt', valueFormatter: promptFormatter },
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
    cellRenderer: AiJobActionsCell,
    sortable: false,
    filter: false,
    floatingFilter: false,
    flex: 0,
    width: 120,
    minWidth: 120,
  },
];
