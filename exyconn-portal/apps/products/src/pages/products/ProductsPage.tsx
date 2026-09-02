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
import { PRODUCT_COLUMNS, type PagedProductRow, type ProductsGridContext } from './products-grid';

/** Products module — catalog dashboard with a server-side products grid. */
export function ProductsPage() {
  // Stat cards come from one server aggregation; the grid is server-paged separately.
  const { data: statsData, refetch: refetchStats } = useListProductsStatsQuery();
  const [deleteProduct] = useDeleteProductMutation();
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
    { label: 'Products', value: String(statTotal(stats)), accent: '#4f8cff' },
    { label: 'Active', value: String(statCount(stats, 'status', 'ACTIVE')), accent: '#7be37b' },
    { label: 'In stock', value: String(statSum(stats, 'stock')), accent: '#f97316' },
    { label: 'Archived', value: String(statCount(stats, 'status', 'ARCHIVED')), accent: '#64748b' },
  ];

  const gridContext: ProductsGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
  };

  return (
    <CrudDashboard
      title="Products"
      subtitle="Product catalog"
      entityLabel="product"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <ProductForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={PRODUCT_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search products…"
    />
  );
}
