import type { MouseEvent } from 'react';
import type { ColDef, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Flex, IconButton, Link } from '@exyconn/shell/components/ui';
import { BoolChip } from '@exyconn/shell/components/data/BoolChip';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import type { ListToolsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedToolRow = ListToolsPagedQuery['listToolsPaged']['rows'][number];

/** Page-level handlers ag-grid hands to the tool cells via its `context`. */
export interface ToolsGridContext {
  onEdit: (row: PagedToolRow) => void;
  onDelete: (row: PagedToolRow) => void;
}

function orderFormatter(params: ValueFormatterParams<PagedToolRow>): string {
  const row = params.data;
  if (!row) {
    return '';
  }
  return String(row.order);
}

function UrlCell(params: Readonly<ICellRendererParams<PagedToolRow>>) {
  const url = params.data?.url;
  if (!url) {
    return <>—</>;
  }
  return (
    <Link href={url} target="_blank" rel="noopener noreferrer">
      {url}
    </Link>
  );
}

function StatusCell(params: Readonly<ICellRendererParams<PagedToolRow>>) {
  if (!params.data) {
    return null;
  }
  return <StatusChip value={params.data.isActive ? 'ACTIVE' : 'INACTIVE'} />;
}

function MvpCell(params: Readonly<ICellRendererParams<PagedToolRow>>) {
  if (!params.data) {
    return null;
  }
  return <BoolChip value={params.data.isMVP} />;
}

function ToolActionsCell(params: Readonly<ICellRendererParams<PagedToolRow>>) {
  const row = params.data;
  const ctx = params.context as ToolsGridContext;
  if (!row) {
    return null;
  }
  const run = (handler: (target: PagedToolRow) => void) => (event: MouseEvent) => {
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

/** Column model for the server-side Tools grid. Name/Code/Category hit the server filter. */
export const TOOL_COLUMNS: ColDef<PagedToolRow>[] = [
  { field: 'name', headerName: 'Name' },
  { field: 'toolCode', headerName: 'Code' },
  { field: 'categorySlug', headerName: 'Category' },
  {
    colId: 'url',
    headerName: 'URL',
    cellRenderer: UrlCell,
    sortable: false,
    filter: false,
    floatingFilter: false,
  },
  {
    field: 'isActive',
    headerName: 'Active',
    cellRenderer: StatusCell,
    filter: false,
    floatingFilter: false,
  },
  {
    field: 'isMVP',
    headerName: 'MVP',
    cellRenderer: MvpCell,
    filter: false,
    floatingFilter: false,
  },
  {
    field: 'order',
    headerName: 'Order',
    valueFormatter: orderFormatter,
    filter: false,
    floatingFilter: false,
  },
  {
    colId: 'actions',
    headerName: '',
    cellRenderer: ToolActionsCell,
    sortable: false,
    filter: false,
    floatingFilter: false,
    flex: 0,
    width: 120,
    minWidth: 120,
  },
];
