import { DataTable, type Column } from '../../../components/data/DataTable';
import { StatusChip } from '../../../components/data/StatusChip';
import { CrudDialog } from '../../../components/data/CrudDialog';
import { ModuleDashboard } from '../../../components/dashboard/ModuleDashboard';
import type { StatItem } from '../../../components/dashboard/StatCard';
import { useCrudDialog } from '../../../hooks/useCrudDialog';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useNotify } from '../../../components/feedback/NotificationProvider';
import { useListProductsQuery, useDeleteProductMutation } from '../../../graphql/generated';
import { ProductForm, type ProductRow } from './forms/product';

/** Products module — catalog dashboard. */
export function ProductsPage() {
  const { data, loading, refetch } = useListProductsQuery();
  const [deleteProduct] = useDeleteProductMutation();
  const dialog = useCrudDialog<ProductRow>();
  const confirm = useConfirm();
  const notify = useNotify();

  const rows = data?.listProducts ?? [];
  const stock = rows.reduce((sum, r) => sum + r.stock, 0);
  const stats: StatItem[] = [
    {
      label: 'Products',
      value: String(rows.length),
      accent: '#4f8cff',
    },
    {
      label: 'Active',
      value: String(rows.filter((r) => r.status === 'ACTIVE').length),
      accent: '#7be37b',
    },
    {
      label: 'In stock',
      value: String(stock),
      accent: '#f97316',
    },
    {
      label: 'Archived',
      value: String(rows.filter((r) => r.status === 'ARCHIVED').length),
      accent: '#64748b',
    },
  ];

  const columns: Column<ProductRow>[] = [
    { key: 'name', label: 'Name' },
    { key: 'sku', label: 'SKU' },
    { key: 'category', label: 'Category' },
    { key: 'price', label: 'Price', render: (r) => r.price.toLocaleString() },
    { key: 'stock', label: 'Stock' },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
  ];

  const handleDelete = async (row: ProductRow) => {
    const ok = await confirm({ message: `Delete product "${row.name}"?`, confirmText: 'Delete' });
    if (!ok) return;
    await deleteProduct({ variables: { id: row.id } });
    await refetch();
    notify('Product deleted');
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
              void refetch();
              dialog.close();
            }}
          />
        </CrudDialog>
      }
    >
      <DataTable
        columns={columns}
        rows={rows}
        onEdit={dialog.openEdit}
        onDelete={handleDelete}
        emptyMessage={loading ? 'Loading…' : 'No products yet.'}
      />
    </ModuleDashboard>
  );
}
