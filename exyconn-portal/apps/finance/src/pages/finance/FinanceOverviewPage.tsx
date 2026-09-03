import { useMemo, useState } from 'react';
import { Box, Grid } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { ModuleDashboard } from '@exyconn/shell/components/dashboard/ModuleDashboard';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { StatBreakdown } from '@exyconn/shell/components/dashboard/StatBreakdown';
import { LineChart } from '@exyconn/shell/components/dashboard/LineChart';
import { formatMoney } from '@exyconn/shell/utils/money';
import { useCompanyFinanceQuery } from '@exyconn/shell/graphql/generated';
import { financePeriods, periodFor } from './finance-period';
import { FinancePeriodPicker } from './FinancePeriodPicker';
import { FinanceMoneyPanel, type MoneyLine } from './FinanceMoneyPanel';

/** Rounded whole units — a dashboard is read at a glance, not reconciled to the paisa. */
const round = (amount: number): number => Math.round(amount);

/**
 * Finance → Overview: the company's money, on one page.
 *
 * Everything here is scoped to one stated period, and the two halves of the story are kept
 * apart on purpose. What the period EARNED and COST (accrual) answers "are we profitable";
 * what actually MOVED (cash) answers "can we pay people this month". They are different
 * numbers, they routinely disagree, and a dashboard that blends them into one figure called
 * "revenue" is how a company convinces itself it is fine while running out of money.
 */
export function FinanceOverviewPage() {
  const [periodKey, setPeriodKey] = useState('last-3');
  const periods = useMemo(() => financePeriods(), []);
  const period = useMemo(() => periodFor(periodKey), [periodKey]);

  const { data, loading } = useCompanyFinanceQuery({
    variables: { from: period.from.toISOString(), to: period.to.toISOString() },
    fetchPolicy: 'cache-and-network',
  });
  const finance = data?.companyFinance;

  const stats: StatItem[] = [
    { label: 'Invoiced', value: formatMoney(finance?.invoiced ?? 0), accent: '#4f8cff' },
    { label: 'Total cost', value: formatMoney(finance?.totalCost ?? 0), accent: '#f9851f' },
    {
      label: 'Profit',
      value: formatMoney(finance?.profit ?? 0),
      accent: (finance?.profit ?? 0) < 0 ? '#ff6b6b' : '#22c55e',
    },
    { label: 'Net cash', value: formatMoney(finance?.netCash ?? 0), accent: '#8b5cf6' },
  ];

  const earned: MoneyLine[] = [
    { id: 'invoiced', label: 'Invoiced', amount: finance?.invoiced ?? 0 },
    { id: 'expenses', label: 'Company expenses', amount: -(finance?.expenses ?? 0) },
    { id: 'payroll', label: 'Payroll', amount: -(finance?.payroll ?? 0) },
    { id: 'claims', label: 'Reimbursed claims', amount: -(finance?.reimbursements ?? 0) },
    { id: 'profit', label: 'Profit', amount: finance?.profit ?? 0, total: true },
  ];

  const moved: MoneyLine[] = [
    { id: 'collected', label: 'Collected from customers', amount: finance?.collected ?? 0 },
    { id: 'paid', label: 'Bills settled', amount: -(finance?.paidOut ?? 0) },
    { id: 'net', label: 'Net cash movement', amount: finance?.netCash ?? 0, total: true },
  ];

  const owed: MoneyLine[] = [
    { id: 'receivable', label: 'Owed to us', amount: finance?.outstandingReceivable ?? 0 },
    { id: 'payable', label: 'Owed by us', amount: -(finance?.outstandingPayable ?? 0) },
    { id: 'overdue', label: 'Of which already late', amount: -(finance?.overduePayable ?? 0) },
  ];

  const months = finance?.months ?? [];
  const spend = (finance?.byCategory ?? []).map((slice) => ({
    value: slice.label,
    count: round(slice.amount),
  }));

  return (
    <Box>
      <PageHeader title="Finance" subtitle={`Company finances · ${period.label}`}>
        <FinancePeriodPicker periods={periods} value={periodKey} onChange={setPeriodKey} />
      </PageHeader>

      <ModuleDashboard
        title="Company finance"
        subtitle={loading && !finance ? 'Loading…' : `${period.label}, ending today`}
        stats={stats}
      >
        <Grid container spacing={1.5}>
          <Grid item xs={12} md={4}>
            <FinanceMoneyPanel
              title="Earned and spent"
              basis="Accrual — dated when it was invoiced or incurred, whenever the money moves."
              lines={earned}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FinanceMoneyPanel
              title="Cash movement"
              basis="Cash — dated when the money actually arrived or left."
              lines={moved}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FinanceMoneyPanel
              title="Position today"
              basis="As of now, not the period — an old unpaid invoice is still owed today."
              lines={owed}
            />
          </Grid>

          <Grid item xs={12} md={7}>
            <Box sx={{ p: 1 }}>
              <LineChart
                labels={months.map((month) => month.label)}
                data={months.map((month) => round(month.profit))}
                height={240}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={5}>
            <StatBreakdown
              title="Spend by category"
              buckets={spend}
              emptyMessage="No company expenses recorded in this period."
            />
          </Grid>
        </Grid>
      </ModuleDashboard>
    </Box>
  );
}
