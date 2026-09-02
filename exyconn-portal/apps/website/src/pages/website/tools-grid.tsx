import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import {
  actionsColumn,
  boolColumn,
  statusColumn,
  textColumn,
  valueColumn,
  type CrudGridContext,
} from '@exyconn/crud';
import { Link } from '@exyconn/shell/components/ui';
import type { ListToolsPagedQuery } from '@exyconn/shell/graphql/generated';
import { activeStatus } from './active-status';

export type PagedToolRow = ListToolsPagedQuery['listToolsPaged']['rows'][number];

/** Row handlers ag-grid hands to the shared action cells via its `context`. */
export type ToolsGridContext = CrudGridContext<PagedToolRow>;

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

/** Column model for the server-side Tools grid. Name/Code/Category hit the server filter. */
export const TOOL_COLUMNS: ColDef<PagedToolRow>[] = [
  textColumn('name', 'Name'),
  textColumn('toolCode', 'Code'),
  textColumn('categorySlug', 'Category'),
  {
    colId: 'url',
    headerName: 'URL',
    cellRenderer: UrlCell,
    sortable: false,
    filter: false,
    floatingFilter: false,
  },
  statusColumn<PagedToolRow>('isActive', 'Active', activeStatus),
  boolColumn('isMVP', 'MVP'),
  valueColumn('order', 'Order', (row) => String(row.order)),
  actionsColumn(),
];
