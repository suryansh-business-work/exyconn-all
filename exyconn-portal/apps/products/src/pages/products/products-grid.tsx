import type { ColDef } from 'ag-grid-community';
import HistoryIcon from '@mui/icons-material/History';
import {
  DELETE_ACTION,
  EDIT_ACTION,
  actionsColumn,
  dateColumn,
  derivedStatusColumn,
  statusColumn,
  textColumn,
  valueColumn,
  type CrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import type {
  ListProductsPagedQuery,
  ListStockMovementsPagedQuery,
} from '@exyconn/shell/graphql/generated';

export type PagedProductRow = ListProductsPagedQuery['listProductsPaged']['rows'][number];

/** Row handlers ag-grid hands to the shared action cells via its `context`. */
export type ProductsGridContext = CrudGridContext<PagedProductRow>;

/** Stock level read against the product's own reorder level. */
export function stockLevel(row: { stock: number; reorderLevel: number }): string {
  return row.stock <= row.reorderLevel ? 'CRITICAL' : 'HEALTHY';
}

const HISTORY_ACTION: RowActionSpec = {
  key: 'history',
  label: 'stock history',
  icon: HistoryIcon,
  color: 'info',
};

/** Column model for the server-side Products grid. Name/SKU/Category hit the server filter. */
export const PRODUCT_COLUMNS: ColDef<PagedProductRow>[] = [
  textColumn('name', 'Name'),
  textColumn('sku', 'SKU'),
  textColumn('category', 'Category'),
  valueColumn('price', 'Price', (row) => row.price.toLocaleString()),
  valueColumn('stock', 'Stock', (row) => row.stock.toLocaleString()),
  valueColumn('reorderLevel', 'Reorder at', (row) => row.reorderLevel.toLocaleString()),
  derivedStatusColumn('stockLevel', 'Stock level', (row) => stockLevel(row)),
  statusColumn('status', 'Status'),
  actionsColumn([EDIT_ACTION, HISTORY_ACTION, DELETE_ACTION]),
];

export type PagedMovementRow =
  ListStockMovementsPagedQuery['listStockMovementsPaged']['rows'][number];

/** One product's movement history, narrow enough for the drawer it opens in. */
export const HISTORY_COLUMNS: ColDef<PagedMovementRow>[] = [
  dateColumn('createdAt', 'When'),
  statusColumn('reason', 'Reason'),
  valueColumn('quantity', 'Qty', (row) => row.quantity.toLocaleString()),
  valueColumn('stockAfter', 'After', (row) => row.stockAfter.toLocaleString()),
  textColumn('reference', 'Reference'),
];
