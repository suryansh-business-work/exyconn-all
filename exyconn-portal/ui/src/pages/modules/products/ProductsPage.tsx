import { useCallback, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { ServerDataGrid, type TablePageResult } from '../../../components/data/ServerDataGrid';
import { CrudDialog } from '../../../components/data/CrudDialog';
import { ModuleDashboard } from '../../../components/dashboard/ModuleDashboard';
import type { StatItem } from '../../../components/dashboard/StatCard';
import { useCrudDialog } from '../../../hooks/useCrudDialog';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useNotify } from '../../../components/feedback/NotificationProvider';
import { statCount, statSum, statTotal } from '../../../components/data/tableStats';
import {
  useListProductsStatsQuery,
  useDeleteProductMutation,
  ListProductsPagedDocument,
  type ListProductsPagedQuery,
  type ListProductsPagedQueryVariables,
  type TableQueryInput,
} from '../../../graphql/generated';
import { ProductForm, type ProductRow } from './forms/product';
import { PRODUCT_COLUMNS, type PagedProductRow, type ProductsGridContext } from './products-grid';

/** Products module — catalog dashboard with a server-side products grid. */
export function ProductsPage() {
  // Stat cards come from one server aggregation; the grid is server-paged separately.
  const { data: statsData, refetch: refetchStats } = useListProductsStatsQuery();
  const [deleteProduct] = useDeleteProductMutation();
  const dialog = useCrudDialog<ProductRow>();
  const confirm = useConfirm();
  const notify = useNotify();
  const client = useApolloClient();
  const [refreshSignal, setRefreshSignal] = useState(0);

  const stats = statsData?.listProductsStats;
  const statItems: StatItem[] = [
    { label: 'Products', value: String(statTotal(stats)), accent: '#4f8cff' },
    { label: 'Active', value: String(statCount(stats, 'status', 'ACTIVE')), accent: '#7be37b' },
    { label: 'In stock', value: String(statSum(stats, 'stock')), accent: '#f97316' },
    { label: 'Archived', value: String(statCount(stats, 'status', 'ARCHIVED')), accent: '#64748b' },
  ];

  const reload = () => {
    setRefreshSignal((n) => n + 1);
    void refetchStats();
  };

  const fetchRows = useCallback(
    async (input: TableQueryInput): Promise<TablePageResult<PagedProductRow>> => {
      const result = await client.query<ListProductsPagedQuery, ListProductsPagedQueryVariables>({
        query: ListProductsPagedDocument,
        variables: { input },
        fetchPolicy: 'network-only',
      });
      return {
        rows: result.data.listProductsPaged.rows,
        totalCount: result.data.listProductsPaged.totalCount,
      };
    },
    [client],
  );

  const handleDelete = async (row: PagedProductRow) => {
    const ok = await confirm({ message: `Delete product "${row.name}"?`, confirmText: 'Delete' });
    if (!ok) {
      return;
    }
    await deleteProduct({ variables: { id: row.id } });
    reload();
    notify('Product deleted');
  };

  const gridContext: ProductsGridContext = {
    onEdit: dialog.openEdit,
    onDelete: handleDelete,
  };

  return (
    <ModuleDashboard
      title="Products"
      subtitle="Product catalog"
      actionLabel="New product"
      onAction={dialog.openCreate}
      stats={statItems}
      dialog={
        <CrudDialog
          open={dialog.open}
          title={dialog.editing ? 'Edit product' : 'New product'}
          onClose={dialog.close}
        >
          <ProductForm
            initial={dialog.editing}
            onCancel={dialog.close}
            onDone={() => {
              reload();
              dialog.close();
            }}
          />
        </CrudDialog>
      }
    >
      <ServerDataGrid<PagedProductRow>
        columnDefs={PRODUCT_COLUMNS}
        fetchRows={fetchRows}
        context={gridContext}
        refreshSignal={refreshSignal}
        searchPlaceholder="Search products…"
      />
    </ModuleDashboard>
  );
}
