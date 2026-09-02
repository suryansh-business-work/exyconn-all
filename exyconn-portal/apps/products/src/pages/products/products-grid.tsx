import type { MouseEvent } from 'react';
import type { ColDef, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Flex, IconButton } from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import type { ListProductsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedProductRow = ListProductsPagedQuery['listProductsPaged']['rows'][number];

/** Page-level handlers ag-grid hands to the product cells via its `context`. */
export interface ProductsGridContext {
  onEdit: (row: PagedProductRow) => void;
  onDelete: (row: PagedProductRow) => void;
}

function priceFormatter(params: ValueFormatterParams<PagedProductRow>): string {
  const row = params.data;
  if (!row) {
    return '';
  }
  return row.price.toLocaleString();
}

function stockFormatter(params: ValueFormatterParams<PagedProductRow>): string {
  const row = params.data;
  if (!row) {
    return '';
  }
  return row.stock.toLocaleString();
}

function StatusCell(params: Readonly<ICellRendererParams<PagedProductRow>>) {
  if (!params.data) {
    return null;
  }
  return <StatusChip value={params.data.status} />;
}

function ProductActionsCell(params: Readonly<ICellRendererParams<PagedProductRow>>) {
  const row = params.data;
  const ctx = params.context as ProductsGridContext;
  if (!row) {
    return null;
  }
  const run = (handler: (target: PagedProductRow) => void) => (event: MouseEvent) => {
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

/** Column model for the server-side Products grid. Name/SKU/Category hit the server filter. */
export const PRODUCT_COLUMNS: ColDef<PagedProductRow>[] = [
  { field: 'name', headerName: 'Name' },
  { field: 'sku', headerName: 'SKU' },
  { field: 'category', headerName: 'Category' },
  {
    field: 'price',
    headerName: 'Price',
    valueFormatter: priceFormatter,
    filter: false,
    floatingFilter: false,
  },
  {
    field: 'stock',
    headerName: 'Stock',
    valueFormatter: stockFormatter,
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
    colId: 'actions',
    headerName: '',
    cellRenderer: ProductActionsCell,
    sortable: false,
    filter: false,
    floatingFilter: false,
    flex: 0,
    width: 120,
    minWidth: 120,
  },
];
