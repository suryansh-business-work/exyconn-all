import type { MouseEvent } from 'react';
import type { ColDef, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Flex, IconButton } from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import type { ListLeadsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedLeadRow = ListLeadsPagedQuery['listLeadsPaged']['rows'][number];

/** Page-level handlers ag-grid hands to the lead cells via its `context`. */
export interface LeadsGridContext {
  onEdit: (row: PagedLeadRow) => void;
  onDelete: (row: PagedLeadRow) => void;
}

function valueFormatter(params: ValueFormatterParams<PagedLeadRow>): string {
  const row = params.data;
  if (!row) {
    return '';
  }
  return row.value.toLocaleString();
}

function SourceCell(params: Readonly<ICellRendererParams<PagedLeadRow>>) {
  if (!params.data) {
    return null;
  }
  return <StatusChip value={params.data.source} />;
}

function StageCell(params: Readonly<ICellRendererParams<PagedLeadRow>>) {
  if (!params.data) {
    return null;
  }
  return <StatusChip value={params.data.stage} />;
}

function LeadActionsCell(params: Readonly<ICellRendererParams<PagedLeadRow>>) {
  const row = params.data;
  const ctx = params.context as LeadsGridContext;
  if (!row) {
    return null;
  }
  const run = (handler: (target: PagedLeadRow) => void) => (event: MouseEvent) => {
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

/** Column model for the server-side Leads grid. Name/Email hit the server filter. */
export const LEAD_COLUMNS: ColDef<PagedLeadRow>[] = [
  { field: 'name', headerName: 'Name' },
  { field: 'email', headerName: 'Email' },
  {
    field: 'source',
    headerName: 'Source',
    cellRenderer: SourceCell,
    filter: false,
    floatingFilter: false,
  },
  {
    field: 'value',
    headerName: 'Value',
    valueFormatter,
    filter: false,
    floatingFilter: false,
  },
  {
    field: 'stage',
    headerName: 'Stage',
    cellRenderer: StageCell,
    filter: false,
    floatingFilter: false,
  },
  {
    colId: 'actions',
    headerName: '',
    cellRenderer: LeadActionsCell,
    sortable: false,
    filter: false,
    floatingFilter: false,
    flex: 0,
    width: 120,
    minWidth: 120,
  },
];
