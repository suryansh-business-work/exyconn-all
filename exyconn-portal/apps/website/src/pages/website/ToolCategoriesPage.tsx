import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { ModuleDashboard } from '@exyconn/shell/components/dashboard/ModuleDashboard';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { useCrudDialog } from '@exyconn/shell/hooks/useCrudDialog';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  useListToolCategoriesQuery,
  useDeleteToolCategoryMutation,
} from '@exyconn/shell/graphql/generated';
import { ToolCategoryForm, type ToolCategoryRow } from './forms/tool-category';

/** Website CMS — the categories the public tools directory is grouped by. */
export function ToolCategoriesPage() {
  const { data, loading, refetch } = useListToolCategoriesQuery();
  const [deleteToolCategory] = useDeleteToolCategoryMutation();
  const dialog = useCrudDialog<ToolCategoryRow>();
  const confirm = useConfirm();
  const notify = useNotify();

  const rows = data?.listToolCategories ?? [];
  const stats: StatItem[] = [
    { label: 'Categories', value: String(rows.length), accent: '#4f8cff' },
    {
      label: 'Active',
      value: String(rows.filter((r) => r.isActive).length),
      accent: '#7be37b',
    },
  ];

  const columns: Column<ToolCategoryRow>[] = [
    { key: 'category', label: 'Category' },
    { key: 'slug', label: 'Slug' },
    { key: 'icon', label: 'Icon' },
    { key: 'color', label: 'Color' },
    {
      key: 'isActive',
      label: 'Active',
      render: (r) => <StatusChip value={r.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
    { key: 'order', label: 'Order' },
  ];

  const handleDelete = async (row: ToolCategoryRow) => {
    const ok = await confirm({
      message: `Delete tool category ${row.category}?`,
      confirmText: 'Delete',
    });
    if (!ok) return;
    await deleteToolCategory({ variables: { id: row.id } });
    await refetch();
    notify('Tool category deleted');
  };

  return (
    <ModuleDashboard
      title="Tool categories"
      subtitle="Groupings for the public tools directory"
      actionLabel="New category"
      onAction={dialog.openCreate}
      stats={stats}
      dialog={
        <CrudDialog
          open={dialog.open}
          title={dialog.editing ? 'Edit tool category' : 'New tool category'}
          onClose={dialog.close}
        >
          <ToolCategoryForm
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
        emptyMessage={loading ? 'Loading…' : 'No tool categories yet.'}
      />
    </ModuleDashboard>
  );
}
