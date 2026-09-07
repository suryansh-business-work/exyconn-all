import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { ServerDataGrid } from '@exyconn/shell/components/data/ServerDataGrid';
import { usePagedFetcher } from '@exyconn/crud';
import {
  FilterOp,
  ListStockMovementsPagedDocument,
  type ListStockMovementsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { HISTORY_COLUMNS, type PagedProductRow } from './products-grid';

interface ProductHistoryDrawerProps {
  product: PagedProductRow | null;
  onClose: () => void;
}

/** Every movement behind one product's stock level, newest first. */
function ProductHistory({ product }: Readonly<{ product: PagedProductRow }>) {
  const fetchRows = usePagedFetcher(
    ListStockMovementsPagedDocument,
    (data: ListStockMovementsPagedQuery) => data.listStockMovementsPaged,
    [{ field: 'productId', op: FilterOp.Equals, value: product.id }],
  );
  return (
    <ServerDataGrid
      columnDefs={HISTORY_COLUMNS}
      fetchRows={fetchRows}
      searchPlaceholder="Search by reference…"
      height={480}
    />
  );
}

/**
 * The catalogue shows what a level is; this shows how it got there. Keyed on the
 * product so opening another one mounts a fresh grid with its own filter.
 */
export function ProductHistoryDrawer({ product, onClose }: Readonly<ProductHistoryDrawerProps>) {
  return (
    <CrudDialog
      open={Boolean(product)}
      title={product ? `${product.name} — stock history` : 'Stock history'}
      onClose={onClose}
    >
      {product && <ProductHistory key={product.id} product={product} />}
    </CrudDialog>
  );
}
