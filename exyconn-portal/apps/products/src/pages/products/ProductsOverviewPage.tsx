import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import {
  ModuleOverview,
  type OverviewBreakdown,
} from '@exyconn/shell/components/dashboard/ModuleOverview';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statSum, statTotal } from '@exyconn/shell/components/data/tableStats';
import { formatMoney } from '@exyconn/shell/utils/money';
import { useListProductsQuery, useListProductsStatsQuery } from '@exyconn/shell/graphql/generated';
import type { ProductRow } from './forms/product';

/** How many of the newest products the overview lists before sending you to the catalogue. */
const RECENT_PRODUCTS = 8;
/** At or below this, a line is worth restocking rather than reporting. */
const LOW_STOCK = 5;

/** Products → Overview: what the catalogue holds, and what is running out. */
export function ProductsOverviewPage() {
  const { data: statsData } = useListProductsStatsQuery();
  const { data: productsData, loading } = useListProductsQuery();

  const stats = statsData?.listProductsStats;
  const products = productsData?.listProducts ?? [];
  const lowStock = products.filter((p) => p.stock <= LOW_STOCK);

  const statItems: StatItem[] = [
    { label: 'Products', value: String(statTotal(stats)), accent: '#4f8cff' },
    { label: 'Units in stock', value: String(statSum(stats, 'stock')), accent: '#22c55e' },
    { label: 'Low stock', value: String(lowStock.length), accent: '#ff6b6b' },
    { label: 'Catalogue value', value: formatMoney(statSum(stats, 'price')), accent: '#8b5cf6' },
  ];

  const breakdowns: OverviewBreakdown[] = [
    {
      title: 'By category',
      buckets: stats?.counts.find((c) => c.field === 'category')?.buckets ?? [],
      accent: '#4f8cff',
    },
    {
      title: 'By status',
      buckets: stats?.counts.find((c) => c.field === 'status')?.buckets ?? [],
      accent: '#22c55e',
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
