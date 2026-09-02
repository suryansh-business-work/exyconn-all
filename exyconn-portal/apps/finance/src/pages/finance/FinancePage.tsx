import { useCallback, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import {
  ServerDataGrid,
  type TablePageResult,
} from '@exyconn/shell/components/data/ServerDataGrid';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { ModuleDashboard } from '@exyconn/shell/components/dashboard/ModuleDashboard';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { useCrudDialog } from '@exyconn/shell/hooks/useCrudDialog';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { statCount, statSum, statTotal } from '@exyconn/shell/components/data/tableStats';
import {
  useListInvoicesStatsQuery,
  useDeleteInvoiceMutation,
  ListInvoicesPagedDocument,
  type ListInvoicesPagedQuery,
  type ListInvoicesPagedQueryVariables,
  type TableQueryInput,
} from '@exyconn/shell/graphql/generated';
import { InvoiceForm, type InvoiceRow } from './forms/invoice';
import { INVOICE_COLUMNS, type PagedInvoiceRow, type InvoicesGridContext } from './invoices-grid';

/** Finance module — invoice dashboard with a server-side invoices grid. */
export function FinancePage() {
  // Stat cards come from one server aggregation; the grid is server-paged separately.
  const { data: statsData, refetch: refetchStats } = useListInvoicesStatsQuery();
  const [deleteInvoice] = useDeleteInvoiceMutation();
  const dialog = useCrudDialog<InvoiceRow>();
  const confirm = useConfirm();
  const notify = useNotify();
  const { formatDate } = useSettings();
  const client = useApolloClient();
  const [refreshSignal, setRefreshSignal] = useState(0);

  const stats = statsData?.listInvoicesStats;
  const statItems: StatItem[] = [
    { label: 'Invoices', value: String(statTotal(stats)), accent: '#4f8cff' },
    { label: 'Revenue', value: `₹${statSum(stats, 'amount').toLocaleString()}`, accent: '#f9851f' },
    { label: 'Paid', value: String(statCount(stats, 'status', 'PAID')), accent: '#7be37b' },
    { label: 'Overdue', value: String(statCount(stats, 'status', 'OVERDUE')), accent: '#ff6b6b' },
  ];

  const reload = () => {
    setRefreshSignal((n) => n + 1);
    void refetchStats();
  };

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
      stats={statItems}
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
