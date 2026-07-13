import { DataTable, type Column } from '../../../components/data/DataTable';
import { StatusChip } from '../../../components/data/StatusChip';
import { CrudDialog } from '../../../components/data/CrudDialog';
import { ModuleDashboard } from '../../../components/dashboard/ModuleDashboard';
import type { StatItem } from '../../../components/dashboard/StatCard';
import { useCrudDialog } from '../../../hooks/useCrudDialog';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useNotify } from '../../../components/feedback/NotificationProvider';
import { useSettings } from '../../../hooks/useSettings';
import { useListBugsQuery, useDeleteBugMutation } from '../../../graphql/generated';
import { BugForm, type BugRow } from './forms/bug';

/** Bugs module — issue tracking dashboard. */
export function BugsPage() {
  const { data, loading, refetch } = useListBugsQuery();
  const [deleteBug] = useDeleteBugMutation();
  const dialog = useCrudDialog<BugRow>();
  const confirm = useConfirm();
  const notify = useNotify();
  const { formatDate } = useSettings();

  const rows = data?.listBugs ?? [];
  const stats: StatItem[] = [
    {
      label: 'Total bugs',
      value: String(rows.length),
      accent: '#4f8cff',
    },
    {
      label: 'Open',
      value: String(rows.filter((r) => r.status === 'OPEN').length),
      accent: '#f9851f',
    },
    {
      label: 'Critical',
      value: String(rows.filter((r) => r.severity === 'CRITICAL').length),
      accent: '#ff6b6b',
    },
    {
      label: 'Resolved',
      value: String(rows.filter((r) => r.status === 'RESOLVED').length),
      accent: '#7be37b',
    },
  ];

  const columns: Column<BugRow>[] = [
    { key: 'title', label: 'Title' },
    { key: 'assignee', label: 'Assignee' },
    { key: 'severity', label: 'Severity', render: (r) => <StatusChip value={r.severity} /> },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
    { key: 'dueDate', label: 'Due', render: (r) => formatDate(r.dueDate) },
  ];

  const handleDelete = async (row: BugRow) => {
    const ok = await confirm({ message: `Delete bug "${row.title}"?`, confirmText: 'Delete' });
    if (!ok) return;
    await deleteBug({ variables: { id: row.id } });
    await refetch();
    notify('Bug deleted');
  };

  return (
    <ModuleDashboard
      title="Bugs"
      subtitle="Issue tracking"
      actionLabel="New bug"
      onAction={dialog.openCreate}
      stats={stats}
      dialog={
        <CrudDialog
          open={dialog.open}
          title={dialog.editing ? 'Edit bug' : 'New bug'}
          onClose={dialog.close}
        >
          <BugForm
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
        emptyMessage={loading ? 'Loading…' : 'No bugs yet.'}
      />
    </ModuleDashboard>
  );
}
