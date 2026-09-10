import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudFormPage } from '@exyconn/shell/components/data/CrudFormPage';
import { ModuleDashboard } from '@exyconn/shell/components/dashboard/ModuleDashboard';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { useCrudResource } from '@exyconn/crud';
import {
  useListToolCategoriesQuery,
  useDeleteToolCategoryMutation,
} from '@exyconn/shell/graphql/generated';
import { ToolCategoryForm, type ToolCategoryRow } from './forms/tool-category';
import { color } from '@exyconn/shell/components/ui';

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
    { label: 'Categories', value: String(rows.length), accent: color.blue[400] },
    {
      label: 'Active',
      value: String(rows.filter((r) => r.isActive).length),
      accent: color.green[300],
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

  if (crud.open) {
    return (
      <CrudFormPage
        title={crud.editing ? 'Edit tool category' : 'New tool category'}
        onBack={crud.close}
        backLabel="Back to Tool categories"
      >
        <ToolCategoryForm initial={crud.editing} onCancel={crud.close} onDone={crud.onDone} />
      </CrudFormPage>
    );
  }

  return (
    <ModuleDashboard
      title="Tool categories"
      subtitle="Groupings for the public tools directory"
      actionLabel="New category"
      onAction={crud.openCreate}
      stats={stats}
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
