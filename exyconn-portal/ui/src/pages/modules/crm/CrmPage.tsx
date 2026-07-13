import { DataTable, type Column } from '../../../components/data/DataTable';
import { StatusChip } from '../../../components/data/StatusChip';
import { CrudDialog } from '../../../components/data/CrudDialog';
import { ModuleDashboard } from '../../../components/dashboard/ModuleDashboard';
import type { StatItem } from '../../../components/dashboard/StatCard';
import { useCrudDialog } from '../../../hooks/useCrudDialog';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useNotify } from '../../../components/feedback/NotificationProvider';
import { useListLeadsQuery, useDeleteLeadMutation } from '../../../graphql/generated';
import { LeadForm, type LeadRow } from './forms/lead';

/** CRM module — leads & pipeline dashboard. */
export function CrmPage() {
  const { data, loading, refetch } = useListLeadsQuery();
  const [deleteLead] = useDeleteLeadMutation();
  const dialog = useCrudDialog<LeadRow>();
  const confirm = useConfirm();
  const notify = useNotify();

  const rows = data?.listLeads ?? [];
  const pipeline = rows.reduce((sum, r) => sum + r.value, 0);
  const stats: StatItem[] = [
    {
      label: 'Leads',
      value: String(rows.length),
      accent: '#4f8cff',
    },
    {
      label: 'Pipeline',
      value: `₹${pipeline.toLocaleString()}`,
      accent: '#22c55e',
    },
    {
      label: 'Won',
      value: String(rows.filter((r) => r.stage === 'WON').length),
      accent: '#7be37b',
    },
    {
      label: 'Lost',
      value: String(rows.filter((r) => r.stage === 'LOST').length),
      accent: '#ff6b6b',
    },
  ];

  const columns: Column<LeadRow>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'source', label: 'Source', render: (r) => <StatusChip value={r.source} /> },
    { key: 'value', label: 'Value', render: (r) => r.value.toLocaleString() },
    { key: 'stage', label: 'Stage', render: (r) => <StatusChip value={r.stage} /> },
  ];

  const handleDelete = async (row: LeadRow) => {
    const ok = await confirm({ message: `Delete lead "${row.name}"?`, confirmText: 'Delete' });
    if (!ok) return;
    await deleteLead({ variables: { id: row.id } });
    await refetch();
    notify('Lead deleted');
  };

  return (
    <ModuleDashboard
      title="CRM"
      subtitle="Leads & pipeline"
      actionLabel="New lead"
      onAction={dialog.openCreate}
      stats={stats}
      dialog={
        <CrudDialog
          open={dialog.open}
          title={dialog.editing ? 'Edit lead' : 'New lead'}
          onClose={dialog.close}
        >
          <LeadForm
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
        emptyMessage={loading ? 'Loading…' : 'No leads yet.'}
      />
    </ModuleDashboard>
  );
}
