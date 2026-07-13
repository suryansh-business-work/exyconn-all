import { DataTable, type Column } from '../../../components/data/DataTable';
import { StatusChip } from '../../../components/data/StatusChip';
import { CrudDialog } from '../../../components/data/CrudDialog';
import { ModuleDashboard } from '../../../components/dashboard/ModuleDashboard';
import type { StatItem } from '../../../components/dashboard/StatCard';
import { useCrudDialog } from '../../../hooks/useCrudDialog';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useNotify } from '../../../components/feedback/NotificationProvider';
import { useSettings } from '../../../hooks/useSettings';
import { useListGigsQuery, useDeleteGigMutation } from '../../../graphql/generated';
import { GigForm, type GigRow } from './forms/gig';

/** Website CMS — freelance gigs published on the public site. */
export function GigsPage() {
  const { data, loading, refetch } = useListGigsQuery();
  const [deleteGig] = useDeleteGigMutation();
  const dialog = useCrudDialog<GigRow>();
  const confirm = useConfirm();
  const notify = useNotify();
  const { formatDate } = useSettings();

  const rows = data?.listGigs ?? [];
  const categories = new Set(rows.map((r) => r.category));
  const stats: StatItem[] = [
    { label: 'Gigs', value: String(rows.length), accent: '#4f8cff' },
    {
      label: 'Open',
      value: String(rows.filter((r) => r.status === 'open').length),
      accent: '#7be37b',
    },
    {
      label: 'Urgent',
      value: String(rows.filter((r) => r.isUrgent).length),
      accent: '#ff6b6b',
    },
    { label: 'Categories', value: String(categories.size), accent: '#f9851f' },
  ];

  const columns: Column<GigRow>[] = [
    { key: 'title', label: 'Title' },
    { key: 'gigCode', label: 'Code' },
    { key: 'category', label: 'Category' },
    { key: 'budget', label: 'Budget' },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
    { key: 'postedDate', label: 'Posted', render: (r) => formatDate(r.postedDate) },
  ];

  const handleDelete = async (row: GigRow) => {
    const ok = await confirm({ message: `Delete gig ${row.title}?`, confirmText: 'Delete' });
    if (!ok) return;
    await deleteGig({ variables: { id: row.id } });
    await refetch();
    notify('Gig deleted');
  };

  return (
    <ModuleDashboard
      title="Gigs"
      subtitle="Freelance gigs on the public site"
      actionLabel="New gig"
      onAction={dialog.openCreate}
      stats={stats}
      dialog={
        <CrudDialog
          open={dialog.open}
          title={dialog.editing ? 'Edit gig' : 'New gig'}
          onClose={dialog.close}
        >
          <GigForm
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
        emptyMessage={loading ? 'Loading…' : 'No gigs yet.'}
      />
    </ModuleDashboard>
  );
}
