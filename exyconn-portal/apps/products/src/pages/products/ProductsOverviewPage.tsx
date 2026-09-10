import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import {
  ModuleOverview,
  type OverviewBreakdown,
} from '@exyconn/shell/components/dashboard/ModuleOverview';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statSum, statTotal } from '@exyconn/shell/components/data/tableStats';
import { formatMoney } from '@exyconn/shell/utils/money';
import {
  useInventoryValueQuery,
  useListProductsQuery,
  useListProductsStatsQuery,
} from '@exyconn/shell/graphql/generated';
import type { ProductRow } from './forms/product';
import { stockLevel } from './products-grid';
import { color } from '@exyconn/shell/components/ui';

/** How many of the newest products the overview lists before sending you to the catalogue. */
const RECENT_PRODUCTS = 8;

/** Products → Overview: what the catalogue holds, and what is running out. */
export function ProductsOverviewPage() {
  const { data: statsData } = useListProductsStatsQuery();
  const { data: valueData } = useInventoryValueQuery();
  const { data: productsData, loading } = useListProductsQuery();

  const stats = statsData?.listProductsStats;
  const products = productsData?.listProducts ?? [];
  // Each line is read against its own reorder level, not one figure for the catalogue.
  const lowStock = products.filter((p) => stockLevel(p) === 'CRITICAL');

  const statItems: StatItem[] = [
    { label: 'Products', value: String(statTotal(stats)), accent: color.blue[400] },
    { label: 'Units in stock', value: String(statSum(stats, 'stock')), accent: color.green[500] },
    { label: 'Low stock', value: String(lowStock.length), accent: color.red[200] },
    {
      label: 'Catalogue value',
      value: formatMoney(valueData?.inventoryValue ?? 0),
      accent: color.violet[400],
    },
  ];

  const breakdowns: OverviewBreakdown[] = [
    {
      title: 'By category',
      buckets: stats?.counts.find((c) => c.field === 'category')?.buckets ?? [],
      accent: color.blue[400],
    },
    {
      title: 'By status',
      buckets: stats?.counts.find((c) => c.field === 'status')?.buckets ?? [],
      accent: color.green[500],
    },
  ];

  const columns: Column<ProductRow>[] = [
    { key: 'name', label: 'Product' },
    { key: 'sku', label: 'SKU' },
    { key: 'category', label: 'Category' },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
    { key: 'stock', label: 'Stock' },
    { key: 'price', label: 'Price', render: (r) => formatMoney(r.price) },
  ];

  const rows = lowStock.length > 0 ? lowStock : products.slice(0, RECENT_PRODUCTS);

  return (
    <ModuleOverview
      title="Products"
      subtitle="Catalogue at a glance"
      stats={statItems}
      breakdowns={breakdowns}
      links={[{ label: 'Open catalogue', to: '/products/catalogue' }]}
      recentTitle={lowStock.length > 0 ? 'Running low' : 'Newest products'}
    >
      <DataTable
        columns={columns}
        rows={rows.slice(0, RECENT_PRODUCTS)}
        emptyMessage={loading ? 'Loading…' : 'No products yet.'}
      />
    </ModuleOverview>
  );
}
