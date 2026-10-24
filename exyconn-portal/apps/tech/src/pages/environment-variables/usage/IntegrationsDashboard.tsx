import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormatters } from '@exyconn/i18n';
import { Box, Grid, Skeleton, Stack, Text, color } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { MetricChart } from '@exyconn/shell/components/dashboard/MetricChart';
import { PointChart } from '@exyconn/shell/components/dashboard/PointChart';
import { StatRow } from '@exyconn/shell/components/dashboard/StatRow';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import {
  BillingProvider,
  useIntegrationUsageQuery,
  type IntegrationUsageQuery,
} from '@exyconn/shell/graphql/generated';
import { ProviderBillingCard } from './ProviderBillingCard';
import { UsageControls } from './UsageControls';
import { USAGE_PROVIDERS } from './usage.providers';
import { useUsageView } from './useUsageView';

type Summary = IntegrationUsageQuery['integrationUsage'][number];
type ProviderRow = Summary & { id: string; label: string };

/** Where an integration's own page lives. */
const SECTION_PATH = '/tech/environment-variables';

/** Every integration's cost added up, day by day. */
function costPerDay(summaries: readonly Summary[]) {
  const totals = new Map<string, number>();
  for (const summary of summaries) {
    for (const day of summary.days) {
      totals.set(day.day, (totals.get(day.day) ?? 0) + day.costUsd);
    }
  }
  return [...totals].map(([period, value]) => ({ period, value }));
}

/**
 * Environment Variables > Dashboard: every integration's calls, failures and cost over the period,
 * in the currency picked, with what OpenAI itself billed. A row opens that integration's page.
 */
export function IntegrationsDashboard() {
  const navigate = useNavigate();
  const { formatNumber } = useFormatters();
  const view = useUsageView();
  const { data, loading, error } = useIntegrationUsageQuery({
    variables: { days: view.days },
    fetchPolicy: 'cache-and-network',
  });
  const summaries = useMemo(() => data?.integrationUsage ?? [], [data]);
  const rows = useMemo<ProviderRow[]>(
    () =>
      summaries.map((summary) => ({
        ...summary,
        id: summary.provider,
        label: USAGE_PROVIDERS[summary.provider].label,
      })),
    [summaries],
  );
  const total = (pick: (summary: Summary) => number) =>
    summaries.reduce((sum, summary) => sum + pick(summary), 0);
  const columns: Column<ProviderRow>[] = [
    { key: 'label', label: 'Integration' },
    { key: 'calls', label: 'Calls', render: (row) => formatNumber(row.calls) },
    { key: 'failures', label: 'Failed', render: (row) => formatNumber(row.failures) },
    { key: 'costUsd', label: 'Estimated cost', render: (row) => view.money(row.costUsd) },
  ];

  let body;
  if (error) {
    body = <Text color="error">{error.message}</Text>;
  } else if (data) {
    body = (
      <Stack spacing={1.5}>
        <StatRow
          stats={[
            { label: 'Calls', value: formatNumber(total((s) => s.calls)), accent: color.blue[400] },
            {
              label: 'Failed',
              value: formatNumber(total((s) => s.failures)),
              accent: color.red[400],
            },
            {
              label: 'Integrations used',
              value: formatNumber(summaries.filter((s) => s.calls > 0).length),
            },
            {
              label: 'Estimated cost',
              value: view.money(total((s) => s.costUsd)),
              accent: color.amber[500],
            },
          ]}
        />
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <MetricChart
              title="Calls by integration"
              metrics={rows.map((row) => ({ label: row.label, value: row.calls }))}
              formatValue={(value) => formatNumber(value)}
              labelHeading="Integration"
              horizontal
              integer
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <PointChart
              title="Estimated cost per day"
              points={costPerDay(summaries)}
              formatValue={view.money}
              formatPeriod={(period) => period}
              labelHeading="Day"
            />
          </Grid>
        </Grid>
        <DataTable
          columns={columns}
          rows={rows}
          onRowClick={(row) => navigate(`${SECTION_PATH}/${USAGE_PROVIDERS[row.provider].slug}`)}
        />
        <ProviderBillingCard provider={BillingProvider.Openai} view={view} />
      </Stack>
    );
  } else {
    body = loading ? <Skeleton variant="rounded" height={320} /> : null;
  }

  return (
    <Box>
      <PageHeader
        title="Integrations dashboard"
        subtitle="What every integration was used for and what it cost, across the platform"
      />
      <UsageControls view={view} />
      {body}
    </Box>
  );
}
