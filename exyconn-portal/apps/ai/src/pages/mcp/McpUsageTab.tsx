import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useFormatters, useT } from '@exyconn/i18n';
import {
  Alert,
  Grid,
  Link,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  color,
} from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { MetricChart } from '@exyconn/shell/components/dashboard/MetricChart';
import { PointChart } from '@exyconn/shell/components/dashboard/PointChart';
import { StatRow } from '@exyconn/shell/components/dashboard/StatRow';
import { useMcpUsageQuery, type McpUsageQuery } from '@exyconn/shell/graphql/generated';

const WINDOWS = [7, 30, 90, 180] as const;
type ToolRow = McpUsageQuery['mcpUsage']['tools'][number] & { id: string };

/**
 * What the company used Claude for through MCP: calls and failures per day, the tools used most
 * and by whom. MCP calls themselves are not billed; AI work they start counts in AI spend.
 */
export function McpUsageTab() {
  const t = useT();
  const { formatNumber } = useFormatters();
  const [days, setDays] = useState<number>(30);
  const { data, loading, error } = useMcpUsageQuery({
    variables: { days },
    fetchPolicy: 'cache-and-network',
  });
  const usage = data?.mcpUsage;
  const count = (value: number) => formatNumber(value);
  const tools = useMemo<ToolRow[]>(
    () => (usage?.tools ?? []).map((tool) => ({ ...tool, id: tool.tool })),
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
  ];

  let body;
  if (error) {
    body = <Alert severity="error">{error.message}</Alert>;
  } else if (usage) {
    body = (
      <Stack spacing={1.5}>
        <StatRow
          stats={[
            { label: 'Calls', value: count(usage.calls), accent: color.blue[400] },
            { label: 'Failed', value: count(usage.failures), accent: color.red[400] },
            { label: 'People', value: count(usage.people) },
          ]}
        />
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <PointChart
              title="Calls per day"
              points={usage.days.map((day) => ({ period: day.day, value: day.calls }))}
              formatValue={count}
              formatPeriod={(period) => period}
              labelHeading="Day"
              integer
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <MetricChart
              title="Calls by person"
              metrics={usage.users.map((user) => ({ label: user.userName, value: user.calls }))}
              formatValue={count}
              labelHeading="Person"
              horizontal
              integer
            />
          </Grid>
        </Grid>
        <DataTable columns={columns} rows={tools} emptyMessage="No calls in this period." />
        <Alert severity="info">
          {t(
            'Calls through MCP are not billed. AI work a tool starts counts in the AI spend on the',
          )}{' '}
          <Link component={RouterLink} to="/ai">
            {t('AI overview')}
          </Link>
          .
        </Alert>
      </Stack>
    );
  } else {
    body = loading ? <Skeleton variant="rounded" height={280} /> : null;
  }

  return (
    <Stack spacing={1.5}>
      <TextField
        select
        size="small"
        label={t('Period')}
        value={days}
        onChange={(event) => setDays(Number(event.target.value))}
        sx={{ maxWidth: 200 }}
      >
        {WINDOWS.map((value) => (
          <MenuItem key={value} value={value}>
            {t('Last {count} days', { count: value })}
          </MenuItem>
        ))}
      </TextField>
      {body}
    </Stack>
  );
}
