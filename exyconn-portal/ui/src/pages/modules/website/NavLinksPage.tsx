import { DataTable, type Column } from '../../../components/data/DataTable';
import { StatusChip } from '../../../components/data/StatusChip';
import { CrudDialog } from '../../../components/data/CrudDialog';
import { ModuleDashboard } from '../../../components/dashboard/ModuleDashboard';
import type { StatItem } from '../../../components/dashboard/StatCard';
import { useCrudDialog } from '../../../hooks/useCrudDialog';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useNotify } from '../../../components/feedback/NotificationProvider';
import { useListNavLinksQuery, useDeleteNavLinkMutation } from '../../../graphql/generated';
import { NavLinkForm, type NavLinkRow } from './forms/nav-link';

/** Website module — navigation links surfaced in the exyconn.com menu and search. */
export function NavLinksPage() {
  const { data, loading, refetch } = useListNavLinksQuery();
  const [deleteNavLink] = useDeleteNavLinkMutation();
  const dialog = useCrudDialog<NavLinkRow>();
  const confirm = useConfirm();
  const notify = useNotify();

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

  const handleDelete = async (row: NavLinkRow) => {
    const ok = await confirm({ message: `Delete nav link "${row.label}"?`, confirmText: 'Delete' });
    if (!ok) return;
    await deleteNavLink({ variables: { id: row.id } });
    await refetch();
    notify('Nav link deleted');
  };

  return (
    <ModuleDashboard
      title="Navigation links"
      subtitle="Menu & search links on exyconn.com"
      actionLabel="New nav link"
      onAction={dialog.openCreate}
      stats={stats}
      dialog={
        <CrudDialog
          open={dialog.open}
          title={dialog.editing ? 'Edit nav link' : 'New nav link'}
          onClose={dialog.close}
        >
          <NavLinkForm
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
        emptyMessage={loading ? 'Loading…' : 'No nav links yet.'}
      />
    </ModuleDashboard>
  );
}
