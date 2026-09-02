import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  statusColumn,
  textColumn,
  valueColumn,
  type CrudGridContext,
} from '@exyconn/crud';
import type { ListProductsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedProductRow = ListProductsPagedQuery['listProductsPaged']['rows'][number];

/** Row handlers ag-grid hands to the shared action cells via its `context`. */
export type ProductsGridContext = CrudGridContext<PagedProductRow>;

/** Column model for the server-side Products grid. Name/SKU/Category hit the server filter. */
export const PRODUCT_COLUMNS: ColDef<PagedProductRow>[] = [
  textColumn('name', 'Name'),
  textColumn('sku', 'SKU'),
  textColumn('category', 'Category'),
  valueColumn('price', 'Price', (row) => row.price.toLocaleString()),
  valueColumn('stock', 'Stock', (row) => row.stock.toLocaleString()),
  statusColumn('status', 'Status'),
  actionsColumn(),
];
