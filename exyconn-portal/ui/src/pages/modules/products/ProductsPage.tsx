import { useCallback, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { ServerDataGrid, type TablePageResult } from '../../../components/data/ServerDataGrid';
import { CrudDialog } from '../../../components/data/CrudDialog';
import { ModuleDashboard } from '../../../components/dashboard/ModuleDashboard';
import type { StatItem } from '../../../components/dashboard/StatCard';
import { useCrudDialog } from '../../../hooks/useCrudDialog';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useNotify } from '../../../components/feedback/NotificationProvider';
import {
  useListProductsQuery,
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
  // Stat cards still summarise all products; the grid itself is server-paged.
  const { data } = useListProductsQuery();
  const [deleteProduct] = useDeleteProductMutation();
  const dialog = useCrudDialog<ProductRow>();
  const confirm = useConfirm();
  const notify = useNotify();
  const client = useApolloClient();
  const [refreshSignal, setRefreshSignal] = useState(0);

  const rows = data?.listProducts ?? [];
  const stock = rows.reduce((sum, r) => sum + r.stock, 0);
  const stats: StatItem[] = [
    { label: 'Products', value: String(rows.length), accent: '#4f8cff' },
    {
      label: 'Active',
      value: String(rows.filter((r) => r.status === 'ACTIVE').length),
      accent: '#7be37b',
    },
    { label: 'In stock', value: String(stock), accent: '#f97316' },
    {
      label: 'Archived',
      value: String(rows.filter((r) => r.status === 'ARCHIVED').length),
      accent: '#64748b',
    },
  ];

  const reload = () => setRefreshSignal((n) => n + 1);

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
      stats={stats}
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
