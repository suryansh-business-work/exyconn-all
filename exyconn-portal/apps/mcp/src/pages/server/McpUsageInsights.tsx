import { useMemo } from 'react';
import { useFormatters } from '@exyconn/i18n';
import { Grid, Stack, color } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { MetricChart } from '@exyconn/shell/components/dashboard/MetricChart';
import { PointChart } from '@exyconn/shell/components/dashboard/PointChart';
import { StatRow } from '@exyconn/shell/components/dashboard/StatRow';
import { McpEndpoint, type McpUsageQuery } from '@exyconn/shell/graphql/generated';

type Usage = McpUsageQuery['mcpUsage'];
type ToolRow = Usage['tools'][number] & { id: string };
type Count = (value: number) => string;

/** The calls that worked, 0–100; 100 when nothing was called. */
export const successRate = (usage: Pick<Usage, 'calls' | 'failures'>) =>
  usage.calls === 0 ? 100 : ((usage.calls - usage.failures) / usage.calls) * 100;

/** The headline numbers: volume, reliability and speed. */
function UsageStats({ usage, count }: Readonly<{ usage: Usage; count: Count }>) {
  const { formatPercent } = useFormatters();
  const ms = (value: number) => `${count(Math.round(value))} ms`;
  return (
    <StatRow
      stats={[
        { label: 'Calls', value: count(usage.calls), accent: color.blue[400] },
        { label: 'Success rate', value: formatPercent(successRate(usage)) },
        { label: 'Failed', value: count(usage.failures), accent: color.red[400] },
        { label: 'Changes made', value: count(usage.writes) },
        { label: 'Median time', value: ms(usage.p50Ms) },
        { label: 'Slowest 5% over', value: ms(usage.p95Ms) },
        { label: 'People', value: count(usage.people) },
      ]}
    />
  );
}

/** Calls and failures per day, and who, which client and which module made them. */
function UsageCharts({
  usage,
  count,
  endpoint,
}: Readonly<{ usage: Usage; count: Count; endpoint: McpEndpoint }>) {
  const half = { xs: 12, md: 6 };
  return (
    <Grid container spacing={1.5}>
      <Grid size={half}>
        <PointChart
          title="Calls per day"
          points={usage.days.map((day) => ({ period: day.day, value: day.calls }))}
          formatValue={count}
          formatPeriod={(period) => period}
          labelHeading="Day"
          integer
        />
      </Grid>
      <Grid size={half}>
        <PointChart
          title="Failed calls per day"
          points={usage.days.map((day) => ({ period: day.day, value: day.failures }))}
          formatValue={count}
          formatPeriod={(period) => period}
          labelHeading="Day"
          integer
        />
      </Grid>
      <Grid size={half}>
        <MetricChart
          title="Calls by person"
          metrics={usage.users.map((user) => ({ label: user.userName, value: user.calls }))}
          formatValue={count}
          labelHeading="Person"
          horizontal
          integer
        />
      </Grid>
      <Grid size={half}>
        <MetricChart
          title="Failures by kind"
          metrics={usage.errorCodes.map((row) => ({ label: row.code, value: row.count }))}
          formatValue={count}
          labelHeading="Kind"
          horizontal
          integer
        />
      </Grid>
      <Grid size={half}>
        <MetricChart
          title="Calls by client"
          metrics={usage.clients.map((row) => ({ label: row.clientName, value: row.calls }))}
          formatValue={count}
          labelHeading="Client"
          horizontal
          integer
        />
      </Grid>
      {endpoint === McpEndpoint.All && (
        <Grid size={half}>
          <MetricChart
            title="Calls by module"
            metrics={usage.servers.map((row) => ({ label: row.server, value: row.calls }))}
            formatValue={count}
            labelHeading="Module"
            horizontal
            integer
          />
        </Grid>
      )}
    </Grid>
  );
}

/**
 * One server's usage over a window: how much Claude was used, how reliably and how fast, per
 * day, by person, client, module and failure kind, and per tool with its p95 time.
 */
export function McpUsageInsights({
  usage,
  endpoint,
}: Readonly<{ usage: Usage; endpoint: McpEndpoint }>) {
  const { formatNumber, formatDateTime } = useFormatters();
  const count = (value: number) => formatNumber(value);
  const tools = useMemo<ToolRow[]>(
    () => usage.tools.map((tool) => ({ ...tool, id: tool.tool })),
    [usage],
  );
  const columns: Column<ToolRow>[] = [
    { key: 'tool', label: 'Tool' },
    { key: 'calls', label: 'Calls', render: (row) => count(row.calls) },
    { key: 'failures', label: 'Failed', render: (row) => count(row.failures) },
    {
      key: 'averageMs',
      label: 'Average time (ms)',
      render: (row) => count(Math.round(row.averageMs)),
    },
    { key: 'p95Ms', label: 'Slowest 5% over (ms)', render: (row) => count(row.p95Ms) },
    { key: 'lastAt', label: 'Last called', render: (row) => formatDateTime(row.lastAt) },
  ];
  return (
    <Stack spacing={1.5}>
      <UsageStats usage={usage} count={count} />
      <UsageCharts usage={usage} count={count} endpoint={endpoint} />
      <DataTable columns={columns} rows={tools} emptyMessage="No calls in this period." />
    </Stack>
  );
}
