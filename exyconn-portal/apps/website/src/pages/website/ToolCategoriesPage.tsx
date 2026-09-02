import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { ModuleDashboard } from '@exyconn/shell/components/dashboard/ModuleDashboard';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { useCrudResource } from '@exyconn/crud';
import {
  useListToolCategoriesQuery,
  useDeleteToolCategoryMutation,
} from '@exyconn/shell/graphql/generated';
import { ToolCategoryForm, type ToolCategoryRow } from './forms/tool-category';

/** Website CMS — the categories the public tools directory is grouped by. */
export function ToolCategoriesPage() {
  const { data, loading, refetch } = useListToolCategoriesQuery();
  const [deleteToolCategory] = useDeleteToolCategoryMutation();
  const crud = useCrudResource<ToolCategoryRow>({
    label: 'Tool category',
    onDelete: (row) => deleteToolCategory({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete tool category ${row.category}?`,
    refetch,
  });

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

  return (
    <ModuleDashboard
      title="Tool categories"
      subtitle="Groupings for the public tools directory"
      actionLabel="New category"
      onAction={crud.openCreate}
      stats={stats}
      dialog={
        <CrudDialog
          open={crud.open}
          title={crud.editing ? 'Edit tool category' : 'New tool category'}
          onClose={crud.close}
        >
          <ToolCategoryForm initial={crud.editing} onCancel={crud.close} onDone={crud.onDone} />
        </CrudDialog>
      }
    >
      <DataTable
        columns={columns}
        rows={rows}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        emptyMessage={loading ? 'Loading…' : 'No tool categories yet.'}
      />
    </ModuleDashboard>
  );
}
