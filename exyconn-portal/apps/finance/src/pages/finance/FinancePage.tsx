import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statSum, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useListInvoicesStatsQuery,
  useDeleteInvoiceMutation,
  ListInvoicesPagedDocument,
  type ListInvoicesPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { InvoiceForm, type InvoiceRow } from './forms/invoice';
import { INVOICE_COLUMNS, type PagedInvoiceRow, type InvoicesGridContext } from './invoices-grid';

/** Finance module — invoice dashboard with a server-side invoices grid. */
export function FinancePage() {
  // Stat cards come from one server aggregation; the grid is server-paged separately.
  const { data: statsData, refetch: refetchStats } = useListInvoicesStatsQuery();
  const [deleteInvoice] = useDeleteInvoiceMutation();
  const { formatDate } = useSettings();
  const crud = useCrudResource<InvoiceRow, PagedInvoiceRow>({
    label: 'Invoice',
    onDelete: (row) => deleteInvoice({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete invoice ${row.number}?`,
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListInvoicesPagedDocument,
    (data: ListInvoicesPagedQuery) => data.listInvoicesPaged,
  );

  const stats = statsData?.listInvoicesStats;
  const statItems: StatItem[] = [
    { label: 'Invoices', value: String(statTotal(stats)), accent: '#4f8cff' },
    { label: 'Revenue', value: `₹${statSum(stats, 'amount').toLocaleString()}`, accent: '#f9851f' },
    { label: 'Paid', value: String(statCount(stats, 'status', 'PAID')), accent: '#7be37b' },
    { label: 'Overdue', value: String(statCount(stats, 'status', 'OVERDUE')), accent: '#ff6b6b' },
  ];

  const gridContext: InvoicesGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Finance"
      subtitle="Invoices & billing"
      entityLabel="invoice"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <InvoiceForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={INVOICE_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search invoices…"
    />
  );
}
