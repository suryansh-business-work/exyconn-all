import { useState } from 'react';
import SendIcon from '@mui/icons-material/Send';
import { DataTable, type Column } from '../../../components/data/DataTable';
import { StatusChip } from '../../../components/data/StatusChip';
import { CrudDialog } from '../../../components/data/CrudDialog';
import { ModuleDashboard } from '../../../components/dashboard/ModuleDashboard';
import type { StatItem } from '../../../components/dashboard/StatCard';
import { useCrudDialog } from '../../../hooks/useCrudDialog';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useNotify } from '../../../components/feedback/NotificationProvider';
import { useSettings } from '../../../hooks/useSettings';
import { useListContractsQuery, useDeleteContractMutation } from '../../../graphql/generated';
import { ContractForm, type ContractRow } from './forms/contract';
import { SendContractForm } from './forms/send-contract';

/** Legal → Contracts: contract CRUD plus emailing a contract to a counterparty. */
export function ContractsPage() {
  const { data, loading, refetch } = useListContractsQuery();
  const [deleteContract] = useDeleteContractMutation();
  const dialog = useCrudDialog<ContractRow>();
  const [sendTarget, setSendTarget] = useState<ContractRow | null>(null);
  const confirm = useConfirm();
  const notify = useNotify();
  const { formatDate } = useSettings();

  const rows = data?.listContracts ?? [];
  const count = (s: string) => rows.filter((r) => r.status === s).length;
  const stats: StatItem[] = [
    { label: 'Total', value: String(rows.length), accent: '#4f8cff' },
    { label: 'Active', value: String(count('ACTIVE')), accent: '#22c55e' },
    { label: 'Draft', value: String(count('DRAFT')), accent: '#f59e0b' },
    { label: 'Signed', value: String(rows.filter((r) => r.signedBy).length), accent: '#8b5cf6' },
  ];

  const columns: Column<ContractRow>[] = [
    { key: 'title', label: 'Title' },
    { key: 'party', label: 'Party' },
    { key: 'type', label: 'Type', render: (r) => <StatusChip value={r.type} /> },
    { key: 'expiryDate', label: 'Expires', render: (r) => formatDate(r.expiryDate) },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
    { key: 'sentAt', label: 'Sent', render: (r) => (r.sentAt ? formatDate(r.sentAt) : '—') },
  ];

  const handleDelete = async (row: ContractRow) => {
    const ok = await confirm({ message: `Delete contract "${row.title}"?`, confirmText: 'Delete' });
    if (!ok) return;
    await deleteContract({ variables: { id: row.id } });
    await refetch();
    notify('Contract deleted');
  };

  return (
    <ModuleDashboard
      title="Contracts"
      subtitle="Create, send & track contracts"
      actionLabel="New contract"
      onAction={dialog.openCreate}
      stats={stats}
      dialog={
        <>
          <CrudDialog
            open={dialog.open}
            title={dialog.editing ? 'Edit contract' : 'New contract'}
            onClose={dialog.close}
          >
            <ContractForm
              initial={dialog.editing}
              onCancel={dialog.close}
              onDone={() => {
                void refetch();
                dialog.close();
              }}
            />
          </CrudDialog>
          <CrudDialog
            open={Boolean(sendTarget)}
            title="Send contract"
            onClose={() => setSendTarget(null)}
          >
            {sendTarget && (
              <SendContractForm
                contract={sendTarget}
                onCancel={() => setSendTarget(null)}
                onDone={() => {
                  void refetch();
                  setSendTarget(null);
                }}
              />
            )}
          </CrudDialog>
        </>
      }
    >
      <DataTable
        columns={columns}
        rows={rows}
        onEdit={dialog.openEdit}
        onDelete={handleDelete}
        actions={[
          {
            icon: <SendIcon fontSize="small" />,
            tooltip: 'Send via email',
            ariaLabel: 'send contract',
            color: 'primary',
            onClick: setSendTarget,
          },
        ]}
        emptyMessage={loading ? 'Loading…' : 'No contracts yet.'}
      />
    </ModuleDashboard>
  );
}
