import { useT } from '@exyconn/i18n';
import { Box, Grid, Stack, Text, color } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useItCostSummaryQuery, type ItCostSummaryQuery } from '@exyconn/shell/graphql/generated';
import { MetricChart } from '@exyconn/shell/components/dashboard/MetricChart';
import { StatRow } from '@exyconn/shell/components/dashboard/StatRow';

type CostSummary = ItCostSummaryQuery['itCostSummary'];

/** The four headline numbers: what IT runs per month, per year, and what it bought. */
function tilesOf(cost: CostSummary, money: (value: number) => string): StatItem[] {
  return [
    { label: 'SaaS per month', value: money(cost.saasMonthly), accent: color.cyan[600] },
    { label: 'Cloud per month', value: money(cost.cloudMonthly), accent: color.blue[400] },
    { label: 'Annual run rate', value: money(cost.annualRunRate), accent: color.violet[400] },
    {
      label: 'Bought this year',
      value: money(cost.hardwareThisYear + cost.procurementThisYear),
      accent: color.amber[500],
    },
  ];
}

/**
 * IT › Cost & Budget: SaaS licences and cloud bills as a monthly run rate, and hardware and
 * software bought this year. Budgets themselves are Finance's; this is what IT spends.
 */
export function CostPage() {
  const t = useT();
  const { formatCurrency } = useSettings();
  const money = (value: number) => formatCurrency(value);
  const { data, error } = useItCostSummaryQuery({ fetchPolicy: 'cache-and-network' });
  const cost = data?.itCostSummary;

  return (
    <Box>
      <PageHeader
        title="IT Cost & Budget"
        subtitle="SaaS spend, cloud bills, licences and hardware costs"
      />
      {error && <Text color="error">{error.message}</Text>}
      {cost && (
        <Stack spacing={1.5}>
          <StatRow stats={tilesOf(cost, money)} />
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <MetricChart
                title="Spend by category"
                subtitle={t('Running costs per year, one-off spend this year')}
                metrics={cost.byCategory}
                formatValue={money}
                labelHeading="Category"
                horizontal
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <MetricChart
                title="Top vendors"
                subtitle={t('Yearly running cost')}
                metrics={cost.byVendor}
                formatValue={money}
                labelHeading="Vendor"
                horizontal
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <MetricChart
                title="One-off spend by month"
                subtitle={t('Hardware bought and software or services delivered')}
                metrics={cost.oneOffByMonth}
                formatValue={money}
                labelHeading="Month"
              />
            </Grid>
          </Grid>
        </Stack>
      )}
    </Box>
  );
}
