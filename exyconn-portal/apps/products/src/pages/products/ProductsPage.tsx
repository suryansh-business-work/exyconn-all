import { useState } from 'react';
import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statSum, statTotal } from '@exyconn/shell/components/data/tableStats';
import {
  useListProductsStatsQuery,
  useDeleteProductMutation,
  ListProductsPagedDocument,
  type ListProductsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { ProductForm, type ProductRow } from './forms/product';
import { ProductHistoryDrawer } from './ProductHistoryDrawer';
import { PRODUCT_COLUMNS, type PagedProductRow, type ProductsGridContext } from './products-grid';
import { color } from '@exyconn/shell/components/ui';

/** Products module — catalog dashboard with a server-side products grid. */
export function ProductsPage() {
  // Stat cards come from one server aggregation; the grid is server-paged separately.
  const { data: statsData, refetch: refetchStats } = useListProductsStatsQuery();
  const [deleteProduct] = useDeleteProductMutation();
  const [history, setHistory] = useState<PagedProductRow | null>(null);
  const crud = useCrudResource<ProductRow, PagedProductRow>({
    label: 'Product',
    onDelete: (row) => deleteProduct({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete product "${row.name}"?`,
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListProductsPagedDocument,
    (data: ListProductsPagedQuery) => data.listProductsPaged,
  );

  const stats = statsData?.listProductsStats;
  const statItems: StatItem[] = [
    { label: 'Products', value: String(statTotal(stats)), accent: color.blue[400] },
    {
      label: 'Active',
      value: String(statCount(stats, 'status', 'ACTIVE')),
      accent: color.green[300],
    },
    { label: 'In stock', value: String(statSum(stats, 'stock')), accent: color.orange[600] },
    {
      label: 'Archived',
      value: String(statCount(stats, 'status', 'ARCHIVED')),
      accent: color.slate[500],
    },
  ];

  const gridContext: ProductsGridContext = {
    actions: { edit: crud.openEdit, history: setHistory, delete: crud.remove },
  };

  return (
    <CrudDashboard
      title="Products"
      subtitle="Product catalog"
      entityLabel="product"
      exportFileName="products"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <ProductForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      permissionModule="Product"
      columnDefs={PRODUCT_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search products…"
      extraDialogs={<ProductHistoryDrawer product={history} onClose={() => setHistory(null)} />}
    />
  );
}
