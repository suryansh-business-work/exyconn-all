import { DataTable, type Column } from '../../../components/data/DataTable';
import { StatusChip } from '../../../components/data/StatusChip';
import { CrudDialog } from '../../../components/data/CrudDialog';
import { ModuleDashboard } from '../../../components/dashboard/ModuleDashboard';
import type { StatItem } from '../../../components/dashboard/StatCard';
import { useCrudDialog } from '../../../hooks/useCrudDialog';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useNotify } from '../../../components/feedback/NotificationProvider';
import { useSettings } from '../../../hooks/useSettings';
import { useListInvoicesQuery, useDeleteInvoiceMutation } from '../../../graphql/generated';
import { InvoiceForm, type InvoiceRow } from './forms/invoice';

/** Finance module — invoice analytics dashboard. */
export function FinancePage() {
  const { data, loading, refetch } = useListInvoicesQuery();
  const [deleteInvoice] = useDeleteInvoiceMutation();
  const dialog = useCrudDialog<InvoiceRow>();
  const confirm = useConfirm();
  const notify = useNotify();
  const { formatDate } = useSettings();

  const rows = data?.listInvoices ?? [];
  const revenue = rows.reduce((sum, r) => sum + r.amount, 0);
  const stats: StatItem[] = [
    {
      label: 'Invoices',
      value: String(rows.length),
      accent: '#4f8cff',
    },
    {
      label: 'Revenue',
      value: `₹${revenue.toLocaleString()}`,
      accent: '#f9851f',
    },
    {
      label: 'Paid',
      value: String(rows.filter((r) => r.status === 'PAID').length),
      accent: '#7be37b',
    },
    {
      label: 'Overdue',
      value: String(rows.filter((r) => r.status === 'OVERDUE').length),
      accent: '#ff6b6b',
    },
  ];

  const columns: Column<InvoiceRow>[] = [
    { key: 'number', label: 'Number' },
    { key: 'clientId', label: 'Client' },
    { key: 'amount', label: 'Amount', render: (r) => `${r.currency} ${r.amount.toLocaleString()}` },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
    { key: 'dueDate', label: 'Due', render: (r) => formatDate(r.dueDate) },
  ];

  const handleDelete = async (row: InvoiceRow) => {
    const ok = await confirm({ message: `Delete invoice ${row.number}?`, confirmText: 'Delete' });
    if (!ok) return;
    await deleteInvoice({ variables: { id: row.id } });
    await refetch();
    notify('Invoice deleted');
  };

  return (
    <ModuleDashboard
      title="Finance"
      subtitle="Invoices & billing"
      actionLabel="New invoice"
      onAction={dialog.openCreate}
      stats={stats}
      dialog={
        <CrudDialog
          open={dialog.open}
          title={dialog.editing ? 'Edit invoice' : 'New invoice'}
          onClose={dialog.close}
        >
          <InvoiceForm
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
        emptyMessage={loading ? 'Loading…' : 'No invoices yet.'}
      />
    </ModuleDashboard>
  );
}
