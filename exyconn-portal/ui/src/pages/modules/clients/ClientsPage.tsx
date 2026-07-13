import { DataTable, type Column } from '../../../components/data/DataTable';
import { StatusChip } from '../../../components/data/StatusChip';
import { CrudDialog } from '../../../components/data/CrudDialog';
import { ModuleDashboard } from '../../../components/dashboard/ModuleDashboard';
import type { StatItem } from '../../../components/dashboard/StatCard';
import { useCrudDialog } from '../../../hooks/useCrudDialog';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useNotify } from '../../../components/feedback/NotificationProvider';
import { useListClientsQuery, useDeleteClientMutation } from '../../../graphql/generated';
import { ClientForm, type ClientRow } from './forms/client';

/** Clients module — client directory dashboard. */
export function ClientsPage() {
  const { data, loading, refetch } = useListClientsQuery();
  const [deleteClient] = useDeleteClientMutation();
  const dialog = useCrudDialog<ClientRow>();
  const confirm = useConfirm();
  const notify = useNotify();

  const rows = data?.listClients ?? [];
  const stats: StatItem[] = [
    {
      label: 'Clients',
      value: String(rows.length),
      accent: '#4f8cff',
    },
    {
      label: 'Active',
      value: String(rows.filter((r) => r.status === 'ACTIVE').length),
      accent: '#7be37b',
    },
    {
      label: 'Prospects',
      value: String(rows.filter((r) => r.status === 'PROSPECT').length),
      accent: '#f9851f',
    },
    {
      label: 'Inactive',
      value: String(rows.filter((r) => r.status === 'INACTIVE').length),
      accent: '#ff6b6b',
    },
  ];

  const columns: Column<ClientRow>[] = [
    { key: 'name', label: 'Name' },
    { key: 'company', label: 'Company' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
  ];

  const handleDelete = async (row: ClientRow) => {
    const ok = await confirm({ message: `Delete client "${row.name}"?`, confirmText: 'Delete' });
    if (!ok) return;
    await deleteClient({ variables: { id: row.id } });
    await refetch();
    notify('Client deleted');
  };

  return (
    <ModuleDashboard
      title="Clients"
      subtitle="Client directory"
      actionLabel="New client"
      onAction={dialog.openCreate}
      stats={stats}
      dialog={
        <CrudDialog
          open={dialog.open}
          title={dialog.editing ? 'Edit client' : 'New client'}
          onClose={dialog.close}
        >
          <ClientForm
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
        emptyMessage={loading ? 'Loading…' : 'No clients yet.'}
      />
    </ModuleDashboard>
  );
}
