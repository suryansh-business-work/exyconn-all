import { Alert, Box, Flex, Grid, Text } from '@exyconn/shell/components/ui';
import { StatCard, type StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { StatBreakdown } from '@exyconn/shell/components/dashboard/StatBreakdown';
import { LineChart } from '@exyconn/shell/components/dashboard/LineChart';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useEmailDashboardQuery,
  type EmailLogFieldsFragment,
} from '@exyconn/shell/graphql/generated';

/** Days of sending the trend covers. Two weeks is enough to see a break start. */
const TREND_DAYS = 14;

/** `2026-09-04` → `04 Sep`, which is all a 14-point axis has room for. */
function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00.000Z`).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  });
}

/** Tech → Email → Dashboard: is email working, and what has it been doing. */
export function EmailDashboardPanel() {
  const { data, loading } = useEmailDashboardQuery({
    variables: { days: TREND_DAYS },
    fetchPolicy: 'cache-and-network',
  });
  const { formatDateTime } = useSettings();
  const board = data?.emailDashboard;

  const stats: StatItem[] = [
    { label: 'Templates', value: String(board?.templates ?? 0), accent: '#4f8cff' },
    { label: 'Active', value: String(board?.activeTemplates ?? 0), accent: '#22c55e' },
    { label: `Sent · ${TREND_DAYS}d`, value: String(board?.sent ?? 0), accent: '#8b5cf6' },
    { label: `Failed · ${TREND_DAYS}d`, value: String(board?.failed ?? 0), accent: '#ff6b6b' },
  ];

  const failureColumns: Column<EmailLogFieldsFragment>[] = [
    { key: 'sentAt', label: 'When', render: (row) => formatDateTime(row.sentAt) },
    { key: 'templateName', label: 'Template' },
    { key: 'to', label: 'To' },
    { key: 'error', label: 'Reason' },
  ];

  const usage = (board?.byTemplate ?? []).map((row) => ({
    value: row.name || row.key,
    count: row.sent + row.failed,
  }));

  return (
    <Box>
      {/* First, because every other number here can look healthy while nothing has left. */}
      {board && !board.configured ? (
        <Alert severity="error" variant="outlined" sx={{ mb: 2, borderRadius: '4px' }}>
          No active SMTP configuration, so nothing can be sent. Add one under Settings.
        </Alert>
      ) : null}

      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        {stats.map((stat) => (
          <Grid item xs={6} md={3} key={stat.label}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={1.5}>
        <Grid item xs={12} md={7}>
          <Text size="label" component="div" sx={{ mb: 1 }}>
            Sent per day
          </Text>
          <LineChart
            labels={(board?.days ?? []).map((day) => shortDate(day.date))}
            data={(board?.days ?? []).map((day) => day.sent)}
            height={220}
          />
        </Grid>
        <Grid item xs={12} md={5}>
          <StatBreakdown
            title="Busiest templates"
            buckets={usage}
            emptyMessage="Nothing sent in this window."
          />
        </Grid>
      </Grid>

      <Flex direction="row" alignItems="center" spacing={1} sx={{ mt: 2, mb: 1 }}>
        <Text size="label">Recent failures</Text>
        <StatusChip value={board?.failed ? 'FAILED' : 'RESOLVED'} />
      </Flex>
      <DataTable
        columns={failureColumns}
        rows={board?.recentFailures ?? []}
        emptyMessage={loading ? 'Loading…' : 'Nothing has failed recently.'}
      />
    </Box>
  );
}
