import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { ModuleDashboard } from '@exyconn/shell/components/dashboard/ModuleDashboard';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { useCrudResource } from '@exyconn/crud';
import { useListNavLinksQuery, useDeleteNavLinkMutation } from '@exyconn/shell/graphql/generated';
import { NavLinkForm, type NavLinkRow } from './forms/nav-link';

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
    { label: 'Links', value: String(rows.length), accent: '#4f8cff' },
    { label: 'Active', value: String(rows.filter((r) => r.isActive).length), accent: '#7be37b' },
    { label: 'Categories', value: String(categories.size), accent: '#f9851f' },
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

  return (
    <ModuleDashboard
      title="Navigation links"
      subtitle="Menu & search links on exyconn.com"
      actionLabel="New nav link"
      onAction={crud.openCreate}
      stats={stats}
      dialog={
        <CrudDialog
          open={crud.open}
          title={crud.editing ? 'Edit nav link' : 'New nav link'}
          onClose={crud.close}
        >
          <NavLinkForm initial={crud.editing} onCancel={crud.close} onDone={crud.onDone} />
        </CrudDialog>
      }
    >
      <DataTable
        columns={columns}
        rows={rows}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        emptyMessage={loading ? 'Loading…' : 'No nav links yet.'}
      />
    </ModuleDashboard>
  );
}
