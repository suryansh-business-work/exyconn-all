import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudFormPage } from '@exyconn/shell/components/data/CrudFormPage';
import { ModuleDashboard } from '@exyconn/shell/components/dashboard/ModuleDashboard';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { useCrudResource } from '@exyconn/crud';
import { useListNavLinksQuery, useDeleteNavLinkMutation } from '@exyconn/shell/graphql/generated';
import { NavLinkForm, type NavLinkRow } from './forms/nav-link';
import { color } from '@exyconn/shell/components/ui';

/** Website module — navigation links surfaced in the exyconn.com menu and search. */
export function NavLinksPage() {
  const { data, loading, refetch } = useListNavLinksQuery();
  const [deleteNavLink] = useDeleteNavLinkMutation();
  const crud = useCrudResource<NavLinkRow>({
    label: 'Nav link',
    onDelete: (row) => deleteNavLink({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete nav link "${row.label}"?`,
    refetch,
  });

  const rows = data?.listNavLinks ?? [];
  const categories = new Set(rows.map((r) => r.category));
  const stats: StatItem[] = [
    { label: 'Links', value: String(rows.length), accent: color.blue[400] },
    {
      label: 'Active',
      value: String(rows.filter((r) => r.isActive).length),
      accent: color.green[300],
    },
    { label: 'Categories', value: String(categories.size), accent: color.orange[500] },
  ];

  const columns: Column<NavLinkRow>[] = [
    { key: 'label', label: 'Label' },
    { key: 'href', label: 'URL' },
    { key: 'category', label: 'Category' },
    {
      key: 'isActive',
      label: 'Status',
      render: (r) => <StatusChip value={r.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
    { key: 'order', label: 'Order' },
  ];

  if (crud.open) {
    return (
      <CrudFormPage
        title={crud.editing ? 'Edit nav link' : 'New nav link'}
        onBack={crud.close}
        backLabel="Back to Navigation links"
      >
        <NavLinkForm initial={crud.editing} onCancel={crud.close} onDone={crud.onDone} />
      </CrudFormPage>
    );
  }

  return (
    <ModuleDashboard
      title="Navigation links"
      subtitle="Menu & search links on exyconn.com"
      actionLabel="New nav link"
      onAction={crud.openCreate}
      stats={stats}
    >
      <DataTable
        columns={columns}
        rows={rows}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        emptyMessage="No nav links yet."
        loading={loading}
        onRefresh={refetch}
      />
    </ModuleDashboard>
  );
}
