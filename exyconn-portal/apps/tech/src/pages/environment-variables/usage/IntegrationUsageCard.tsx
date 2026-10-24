import { useMemo } from 'react';
import { useFormatters, useT } from '@exyconn/i18n';
import { Grid, Skeleton, Stack, Text, color } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { PointChart } from '@exyconn/shell/components/dashboard/PointChart';
import { StatRow } from '@exyconn/shell/components/dashboard/StatRow';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import {
  BillingProvider,
  IntegrationProvider,
  useIntegrationUsageQuery,
  type IntegrationUsageQuery,
} from '@exyconn/shell/graphql/generated';
import { ProviderBillingCard } from './ProviderBillingCard';
import { UsageControls } from './UsageControls';
import { useUsageView, type UsageView } from './useUsageView';

type Summary = IntegrationUsageQuery['integrationUsage'][number];
type ActionRow = Summary['actions'][number] & { id: string };

/** The headline numbers; tokens and cost only where the integration bills by token. */
function statsOf(summary: Summary, view: UsageView, count: (n: number) => string): StatItem[] {
  const stats: StatItem[] = [
    { label: 'Calls', value: count(summary.calls), accent: color.blue[400] },
    { label: 'Failed', value: count(summary.failures), accent: color.red[400] },
  ];
  if (summary.provider === IntegrationProvider.Openai) {
    stats.push(
      { label: 'Tokens', value: count(summary.inputTokens + summary.outputTokens) },
      { label: 'Estimated cost', value: view.money(summary.costUsd), accent: color.amber[500] },
    );
  }
  return stats;
}

/**
 * The top of an integration's Environment Variables page: what it was used for over the period,
 * day by day and by kind of call, what that cost in the chosen currency, and — for OpenAI with
 * a billing key — what OpenAI actually billed.
 */
export function IntegrationUsageCard({ provider }: Readonly<{ provider: IntegrationProvider }>) {
  const t = useT();
  const { formatNumber } = useFormatters();
  const view = useUsageView();
  const { data, loading, error } = useIntegrationUsageQuery({
    variables: { days: view.days },
    fetchPolicy: 'cache-and-network',
  });
  const summary = data?.integrationUsage.find((row) => row.provider === provider);
  const count = (value: number) => formatNumber(value);
  const columns = useMemo<Column<ActionRow>[]>(
    () => [
      { key: 'action', label: 'Call' },
      { key: 'calls', label: 'Calls', render: (row) => formatNumber(row.calls) },
      { key: 'failures', label: 'Failed', render: (row) => formatNumber(row.failures) },
      { key: 'costUsd', label: 'Cost', render: (row) => view.money(row.costUsd) },
    ],
    [formatNumber, view],
  );

  let body;
  if (error) {
    body = <Text color="error">{error.message}</Text>;
  } else if (summary) {
    body = (
      <Stack spacing={1.5}>
        <StatRow stats={statsOf(summary, view, count)} />
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <PointChart
              title="Calls per day"
              points={summary.days.map((day) => ({ period: day.day, value: day.calls }))}
              formatValue={count}
              formatPeriod={(period) => period}
              labelHeading="Day"
              integer
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <PointChart
              title="Cost per day"
              points={summary.days.map((day) => ({ period: day.day, value: day.costUsd }))}
              formatValue={view.money}
              formatPeriod={(period) => period}
              labelHeading="Day"
            />
          </Grid>
        </Grid>
        <DataTable
          columns={columns}
          rows={summary.actions.map((action) => ({ ...action, id: action.action }))}
          emptyMessage="No calls in this period."
        />
        {provider === IntegrationProvider.Openai && (
          <ProviderBillingCard provider={BillingProvider.Openai} view={view} />
        )}
      </Stack>
    );
  } else {
    body = loading ? <Skeleton variant="rounded" height={240} /> : null;
  }

  return (
    <Stack spacing={1} sx={{ mb: 3 }}>
      <Text component="h2" size="md" weight="bold">
        {t('Usage and billing')}
      </Text>
      <UsageControls view={view} />
      {body}
    </Stack>
  );
}
