import { Box } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { ModuleDashboard } from '@exyconn/shell/components/dashboard/ModuleDashboard';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { useReceivablesQuery } from '@exyconn/shell/graphql/generated';
import { AgeBandCell, toBands, type ReceivablesBand } from './age-band-cell';

/** Bands past the due date. `CURRENT` is money owed but not yet late. */
const LATE_BANDS: ReadonlySet<string> = new Set(['D1_30', 'D31_60', 'D60_PLUS']);

const money = (amount: number): string => `₹${Math.round(amount).toLocaleString()}`;

/**
 * Finance → Receivables: what is owed, and how late it is.
 *
 * Lateness is worked out from each invoice's due date every time this is asked for, never
 * stored — an ageing report that is a day stale is worse than no ageing report.
 */
export function ReceivablesPage() {
  const { data, loading } = useReceivablesQuery({ fetchPolicy: 'cache-and-network' });
  const report = data?.receivables;
  const bands = toBands(report?.buckets ?? []);

  const outstanding = report?.outstanding ?? 0;
  const overdue = report?.overdue ?? 0;
  const stats: StatItem[] = [
    { label: 'Outstanding', value: money(outstanding), accent: '#4f8cff' },
    { label: 'Overdue', value: money(overdue), accent: '#ff6b6b' },
    { label: 'Not yet due', value: money(outstanding - overdue), accent: '#7be37b' },
    { label: 'Open invoices', value: String(report?.invoices ?? 0), accent: '#8b5cf6' },
  ];

  const columns: Column<ReceivablesBand>[] = [
    {
      key: 'label',
      label: 'Age',
      render: (row) => <AgeBandCell label={row.label} late={LATE_BANDS.has(row.band)} />,
    },
    { key: 'invoices', label: 'Invoices', render: (row) => String(row.invoices) },
    { key: 'amount', label: 'Outstanding', render: (row) => money(row.amount) },
    {
      key: 'share',
      label: 'Share',
      render: (row) =>
        outstanding === 0 ? '—' : `${Math.round((row.amount / outstanding) * 100)}%`,
    },
  ];

  return (
    <Box>
      <PageHeader title="Receivables" subtitle="What is owed, and how late it is" />
      <ModuleDashboard title="Ageing" subtitle="Unpaid balances by age" stats={stats}>
        <DataTable
          columns={columns}
          rows={bands}
          emptyMessage={loading ? 'Loading…' : 'Nothing is outstanding.'}
        />
      </ModuleDashboard>
    </Box>
  );
}
