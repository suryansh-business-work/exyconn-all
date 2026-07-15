import { useCallback, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { ServerDataGrid, type TablePageResult } from '../../../components/data/ServerDataGrid';
import { CrudDialog } from '../../../components/data/CrudDialog';
import { ModuleDashboard } from '../../../components/dashboard/ModuleDashboard';
import type { StatItem } from '../../../components/dashboard/StatCard';
import { useCrudDialog } from '../../../hooks/useCrudDialog';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useNotify } from '../../../components/feedback/NotificationProvider';
import { useSettings } from '../../../hooks/useSettings';
import {
  useListInvoicesQuery,
  useDeleteInvoiceMutation,
  ListInvoicesPagedDocument,
  type ListInvoicesPagedQuery,
  type ListInvoicesPagedQueryVariables,
  type TableQueryInput,
} from '../../../graphql/generated';
import { InvoiceForm, type InvoiceRow } from './forms/invoice';
import { INVOICE_COLUMNS, type PagedInvoiceRow, type InvoicesGridContext } from './invoices-grid';

/** Finance module — invoice dashboard with a server-side invoices grid. */
export function FinancePage() {
  // Stat cards still summarise all invoices; the grid itself is server-paged.
  const { data } = useListInvoicesQuery();
  const [deleteInvoice] = useDeleteInvoiceMutation();
  const dialog = useCrudDialog<InvoiceRow>();
  const confirm = useConfirm();
  const notify = useNotify();
  const { formatDate } = useSettings();
  const client = useApolloClient();
  const [refreshSignal, setRefreshSignal] = useState(0);

  const rows = data?.listInvoices ?? [];
  const revenue = rows.reduce((sum, r) => sum + r.amount, 0);
  const stats: StatItem[] = [
    { label: 'Invoices', value: String(rows.length), accent: '#4f8cff' },
    { label: 'Revenue', value: `₹${revenue.toLocaleString()}`, accent: '#f9851f' },
    { label: 'Paid', value: String(rows.filter((r) => r.status === 'PAID').length), accent: '#7be37b' },
    {
      label: 'Overdue',
      value: String(rows.filter((r) => r.status === 'OVERDUE').length),
      accent: '#ff6b6b',
    },
  ];

  const reload = () => setRefreshSignal((n) => n + 1);

  const fetchRows = useCallback(
    async (input: TableQueryInput): Promise<TablePageResult<PagedInvoiceRow>> => {
      const result = await client.query<ListInvoicesPagedQuery, ListInvoicesPagedQueryVariables>({
        query: ListInvoicesPagedDocument,
        variables: { input },
        fetchPolicy: 'network-only',
      });
      return {
        rows: result.data.listInvoicesPaged.rows,
        totalCount: result.data.listInvoicesPaged.totalCount,
      };
    },
    [client],
  );

  const handleDelete = async (row: PagedInvoiceRow) => {
    const ok = await confirm({ message: `Delete invoice ${row.number}?`, confirmText: 'Delete' });
    if (!ok) {
      return;
    }
    await deleteInvoice({ variables: { id: row.id } });
    reload();
    notify('Invoice deleted');
  };

  const gridContext: InvoicesGridContext = {
    onEdit: dialog.openEdit,
    onDelete: handleDelete,
    formatDate,
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
              reload();
              dialog.close();
            }}
          />
        </CrudDialog>
      }
    >
      <ServerDataGrid<PagedInvoiceRow>
        columnDefs={INVOICE_COLUMNS}
        fetchRows={fetchRows}
        context={gridContext}
        refreshSignal={refreshSignal}
        searchPlaceholder="Search invoices…"
      />
    </ModuleDashboard>
  );
}
