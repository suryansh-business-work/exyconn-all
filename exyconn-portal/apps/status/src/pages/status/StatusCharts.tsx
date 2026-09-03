import { Box, Card, Grid, Typography } from '@exyconn/shell/components/ui';
import { LineChart } from '@exyconn/shell/components/dashboard/LineChart';
import { formatWith } from '@exyconn/shell/utils/date';
import type { StatusDay } from './status.types';

interface StatusChartsProps {
  daily: StatusDay[];
}

interface ChartPanelProps {
  title: string;
  caption: string;
  labels: string[];
  data: number[];
  color: string;
}

/** One titled chart panel. Hoisted so it is not redefined on every parent render. */
function ChartPanel({ title, caption, labels, data, color }: Readonly<ChartPanelProps>) {
  return (
    <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
      <Typography variant="subtitle2" fontWeight={700}>
        {title}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {caption}
      </Typography>
      <Box sx={{ mt: 1 }}>
        <LineChart labels={labels} data={data} color={color} height={220} />
      </Box>
    </Card>
  );
}

/** Daily uptime and latency across every monitored service. */
export function StatusCharts({ daily }: Readonly<StatusChartsProps>) {
  const measured = daily.filter((day) => day.checks > 0);

  if (measured.length === 0) {
    return (
      <Card variant="outlined" sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Daily charts appear once the monitor has collected a full day of checks.
        </Typography>
      </Card>
    );
  }

  const labels = measured.map((day) => formatWith(day.date, 'd MMM'));

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <ChartPanel
          title="Daily uptime"
          caption="Share of checks that succeeded, per day"
          labels={labels}
          data={measured.map((day) => day.uptimePercent)}
          color="#22c55e"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <ChartPanel
          title="Average response time"
          caption="Mean round trip across all services, in milliseconds"
          labels={labels}
          data={measured.map((day) => day.avgResponseMs)}
          color="#155dfc"
        />
      </Grid>
    </Grid>
  );
}
