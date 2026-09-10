import { useState } from 'react';
import { Box, Flex, Text } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import { formatMoney } from '@exyconn/shell/utils/money';
import { useBudgetVsActualQuery } from '@exyconn/shell/graphql/generated';
import { financePeriods, periodFor } from '../finance/finance-period';
import { FinancePeriodPicker } from '../finance/FinancePeriodPicker';
import { VarianceBar } from './VarianceBar';

type Row = {
  costCenterId: string;
  code: string;
  name: string;
  budgeted: number;
  actual: number;
  variance: number;
  utilisation?: number | null;
};

/** Money left reads plainly; an overspend is the one thing on this page that needs acting on. */
function VarianceCell({ variance }: Readonly<{ variance: number }>) {
  const over = variance < 0;
  return (
    <Text weight="medium" color={over ? 'error.main' : 'text.primary'}>
      {over ? `${formatMoney(Math.abs(variance))} over` : formatMoney(variance)}
    </Text>
  );
}

/**
 * Finance → Budget vs Actual.
 *
 * Actual is company bills booked to a centre — not payroll and not reimbursed employee
 * claims, neither of which carries one. Spend tagged to no centre gets its own row rather
 * than being dropped, so what the table adds up to is what the company actually spent.
 */
export function BudgetVariancePage() {
  const periods = financePeriods();
  const [periodKey, setPeriodKey] = useState(periods[1].key);
  const period = periodFor(periodKey);

  const { data, loading } = useBudgetVsActualQuery({
    variables: { from: period.from.toISOString(), to: period.to.toISOString() },
    fetchPolicy: 'cache-and-network',
  });

  const rows = (data?.budgetVsActual ?? []) as Row[];
  const budgeted = rows.reduce((sum, row) => sum + row.budgeted, 0);
  const actual = rows.reduce((sum, row) => sum + row.actual, 0);

  const columns: Column<Row>[] = [
    {
      key: 'name',
      label: 'Cost centre',
      render: (r) => (
        <Box>
          <Text weight="medium">{r.name}</Text>
          <Text size="caption" color="text.secondary">
            {r.code}
          </Text>
        </Box>
      ),
    },
    { key: 'budgeted', label: 'Budget', render: (r) => formatMoney(r.budgeted) },
    { key: 'actual', label: 'Spent', render: (r) => formatMoney(r.actual) },
    { key: 'variance', label: 'Left', render: (r) => <VarianceCell variance={r.variance} /> },
    {
      key: 'utilisation',
      label: 'Used',
      render: (r) => <VarianceBar utilisation={r.utilisation ?? null} />,
    },
  ];

  return (
    <Box>
      <Flex direction="row" justifyContent="space-between" alignItems="center">
        <PageHeader
          title="Budget vs Actual"
          subtitle={`${period.label} — ${formatMoney(actual)} spent of ${formatMoney(budgeted)} budgeted`}
        />
        <FinancePeriodPicker periods={periods} value={periodKey} onChange={setPeriodKey} />
      </Flex>
      <Box sx={[glass, { p: { xs: 1, md: 1.5 } }]}>
        <DataTable
          columns={columns}
          rows={rows.map((row) => ({ ...row, id: row.costCenterId || 'unallocated' }))}
          emptyMessage={loading ? 'Loading…' : 'No budgets set and no spend booked in this period.'}
        />
      </Box>
    </Box>
  );
}
