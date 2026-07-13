import { DataTable, type Column } from '../../../components/data/DataTable';
import { StatusChip } from '../../../components/data/StatusChip';
import { CrudDialog } from '../../../components/data/CrudDialog';
import { ModuleDashboard } from '../../../components/dashboard/ModuleDashboard';
import type { StatItem } from '../../../components/dashboard/StatCard';
import { useCrudDialog } from '../../../hooks/useCrudDialog';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useNotify } from '../../../components/feedback/NotificationProvider';
import { useListAiJobsQuery, useDeleteAiJobMutation } from '../../../graphql/generated';
import { AiJobForm, type AiJobRow } from './forms/ai-job';

/** AI module — AI jobs dashboard. */
export function AiPage() {
  const { data, loading, refetch } = useListAiJobsQuery();
  const [deleteAiJob] = useDeleteAiJobMutation();
  const dialog = useCrudDialog<AiJobRow>();
  const confirm = useConfirm();
  const notify = useNotify();

  const rows = data?.listAiJobs ?? [];
  const stats: StatItem[] = [
    {
      label: 'Jobs',
      value: String(rows.length),
      accent: '#4f8cff',
    },
    {
      label: 'Running',
      value: String(rows.filter((r) => r.status === 'RUNNING').length),
      accent: '#6366f1',
    },
    {
      label: 'Succeeded',
      value: String(rows.filter((r) => r.status === 'SUCCEEDED').length),
      accent: '#7be37b',
    },
    {
      label: 'Failed',
      value: String(rows.filter((r) => r.status === 'FAILED').length),
      accent: '#ff6b6b',
    },
  ];

  const columns: Column<AiJobRow>[] = [
    { key: 'name', label: 'Name' },
    { key: 'model', label: 'Model' },
    { key: 'prompt', label: 'Prompt', render: (r) => r.prompt.slice(0, 48) },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
  ];

  const handleDelete = async (row: AiJobRow) => {
    const ok = await confirm({ message: `Delete AI job "${row.name}"?`, confirmText: 'Delete' });
    if (!ok) return;
    await deleteAiJob({ variables: { id: row.id } });
    await refetch();
    notify('AI job deleted');
  };

  return (
    <ModuleDashboard
      title="AI"
      subtitle="AI jobs"
      actionLabel="New job"
      onAction={dialog.openCreate}
      stats={stats}
      dialog={
        <CrudDialog
          open={dialog.open}
          title={dialog.editing ? 'Edit job' : 'New job'}
          onClose={dialog.close}
        >
          <AiJobForm
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
        emptyMessage={loading ? 'Loading…' : 'No AI jobs yet.'}
      />
    </ModuleDashboard>
  );
}
