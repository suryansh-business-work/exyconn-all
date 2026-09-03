import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import {
  ModuleOverview,
  type OverviewBreakdown,
} from '@exyconn/shell/components/dashboard/ModuleOverview';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { formatMoney } from '@exyconn/shell/utils/money';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useListInvoicesQuery,
  useListInvoicesStatsQuery,
  useReceivablesQuery,
} from '@exyconn/shell/graphql/generated';
import type { InvoiceRow } from './forms/invoice';

/** How many invoices the overview lists before sending you to the register. */
const RECENT_INVOICES = 8;

/**
 * An invoice is overdue once its due date has passed and money is still owed on it.
 *
 * Tested on the balance rather than the status: a part-paid invoice past its due date is
 * still overdue for what is left, and reading the status alone would have quietly stopped
 * counting it the moment the first instalment arrived.
 */
function isOverdue(invoice: { balanceDue: number; dueDate?: string | null }): boolean {
  return (
    invoice.balanceDue > 0 && Boolean(invoice.dueDate) && new Date(invoice.dueDate!) < new Date()
  );
}

/** Finance → Overview: what is owed, what is overdue, and what has been paid. */
export function FinanceOverviewPage() {
  const { data: statsData } = useListInvoicesStatsQuery();
  const { data: invoicesData, loading } = useListInvoicesQuery();
  const { data: receivablesData } = useReceivablesQuery();
  const { formatDate } = useSettings();

  const stats = statsData?.listInvoicesStats;
  const invoices = invoicesData?.listInvoices ?? [];
  const overdue = invoices.filter(isOverdue);

  // Invoiced is what was billed; outstanding is what is actually still owed — the figure a
  // finance lead is looking for, and one only the payments ledger can answer.
  const receivables = receivablesData?.receivables;
  const statItems: StatItem[] = [
    { label: 'Invoices', value: String(statTotal(stats)), accent: '#4f8cff' },
    { label: 'Paid', value: String(statCount(stats, 'status', 'PAID')), accent: '#22c55e' },
    {
      label: 'Outstanding',
      value: formatMoney(receivables?.outstanding ?? 0),
      accent: '#8b5cf6',
    },
    { label: 'Overdue', value: formatMoney(receivables?.overdue ?? 0), accent: '#ff6b6b' },
  ];

  const breakdowns: OverviewBreakdown[] = [
    {
      title: 'By status',
      buckets: stats?.counts.find((c) => c.field === 'status')?.buckets ?? [],
      accent: '#4f8cff',
    },
  ];

  const columns: Column<InvoiceRow>[] = [
    { key: 'number', label: 'Invoice' },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
    { key: 'dueDate', label: 'Due', render: (r) => formatDate(r.dueDate) },
    { key: 'amount', label: 'Amount', render: (r) => formatMoney(r.amount) },
    { key: 'balanceDue', label: 'Owing', render: (r) => formatMoney(r.balanceDue) },
  ];

  const rows = overdue.length > 0 ? overdue : invoices;

  return (
    <ModuleOverview
      title="Finance"
      subtitle="Invoicing at a glance"
      stats={statItems}
      breakdowns={breakdowns}
      links={[
        { label: 'Open invoices', to: '/finance/invoices' },
        { label: 'Record a payment', to: '/finance/payments' },
        { label: 'Receivables ageing', to: '/finance/receivables' },
        { label: 'Open expenses', to: '/expenses' },
      ]}
      recentTitle={overdue.length > 0 ? 'Overdue invoices' : 'Newest invoices'}
    >
      <DataTable
        columns={columns}
        rows={rows.slice(0, RECENT_INVOICES)}
        emptyMessage={loading ? 'Loading…' : 'No invoices yet.'}
      />
    </ModuleOverview>
  );
}
