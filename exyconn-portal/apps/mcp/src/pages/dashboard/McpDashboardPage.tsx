import { useFormatters } from '@exyconn/i18n';
import HubIcon from '@mui/icons-material/Hub';
import { Alert, Box, Grid, Skeleton, Stack, color } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { EmptyState } from '@exyconn/shell/components/feedback/EmptyState';
import { MetricChart } from '@exyconn/shell/components/dashboard/MetricChart';
import { PointChart } from '@exyconn/shell/components/dashboard/PointChart';
import { StatRow } from '@exyconn/shell/components/dashboard/StatRow';
import {
  McpEndpoint,
  useMcpServersQuery,
  useMcpUsageQuery,
} from '@exyconn/shell/graphql/generated';
import { McpServerCards } from './McpServerCards';

/** The window the dashboard's numbers cover, in days. */
const DAYS = 30;

/** Calls over the window across every server the person may use: per day and by tool. */
function UsageCharts() {
  const { formatNumber } = useFormatters();
  const { data, error } = useMcpUsageQuery({
    variables: { endpoint: McpEndpoint.All, days: DAYS },
    fetchPolicy: 'cache-and-network',
  });
  const usage = data?.mcpUsage;
  if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }
  if (!usage) {
    return <Skeleton variant="rounded" height={280} />;
  }
  const count = (value: number) => formatNumber(value);
  return (
    <Stack spacing={2}>
      <StatRow
        stats={[
          { label: 'Calls (30 days)', value: count(usage.calls), accent: color.blue[400] },
          { label: 'Failed', value: count(usage.failures), accent: color.red[400] },
          { label: 'People', value: count(usage.people) },
        ]}
      />
      <Grid container spacing={2}>
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
            title="Most used tools"
            metrics={usage.tools.slice(0, 10).map((tool) => ({
              label: tool.tool,
              value: tool.calls,
            }))}
            formatValue={count}
            labelHeading="Tool"
            horizontal
            integer
          />
        </Grid>
      </Grid>
    </Stack>
  );
}

/**
 * MCP dashboard: every server the person may use (each module's, and the global one that
 * combines them), with how Claude was used through them over the last 30 days.
 */
export function McpDashboardPage() {
  const { data, loading, error } = useMcpServersQuery({ fetchPolicy: 'cache-and-network' });
  const servers = data?.mcpServers ?? [];

  let body;
  if (error) {
    body = <Alert severity="error">{error.message}</Alert>;
  } else if (!data) {
    body = loading ? <Skeleton variant="rounded" height={220} /> : null;
  } else if (servers.length === 0) {
    body = (
      <EmptyState
        icon={<HubIcon />}
        title="No MCP server for you yet"
        description="Each module's server opens with that module's role. Ask an administrator for CRM or Marketing access."
      />
    );
  } else {
    body = (
      <Stack spacing={3}>
        <McpServerCards servers={servers} />
        <UsageCharts />
      </Stack>
    );
  }

  return (
    <Box>
      <PageHeader
        title="MCP dashboard"
        subtitle="Connect Claude to Exyconn: one server per module, or one for everything"
      />
      {body}
    </Box>
  );
}
