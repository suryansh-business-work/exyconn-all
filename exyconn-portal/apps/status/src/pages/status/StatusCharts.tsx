import { useMemo } from 'react';
import { useT } from '@exyconn/i18n';
import {
  Card,
  ChartCard,
  Grid,
  TrendChart,
  Typography,
  type ChartData,
  type ValueFormatter,
} from '@exyconn/shell/components/ui';
import { formatWith } from '@exyconn/shell/utils/date';
import type { StatusDay } from './status.types';

interface StatusChartsProps {
  daily: StatusDay[];
}

interface ChartPanelProps {
  title: string;
  caption: string;
  data: ChartData;
  formatValue: ValueFormatter;
  labelHeading: string;
}

const formatPercent: ValueFormatter = (value) => `${value}%`;
const formatMs: ValueFormatter = (value) => `${Math.round(value).toLocaleString()} ms`;

/** One titled Chart.js panel, with its table view. Hoisted so it is not redefined per render. */
function ChartPanel({
  title,
  caption,
  data,
  formatValue,
  labelHeading,
}: Readonly<ChartPanelProps>) {
  return (
    <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
      <ChartCard
        title={title}
        subtitle={caption}
        data={data}
        formatValue={formatValue}
        labelHeading={labelHeading}
      >
        <TrendChart data={data} formatValue={formatValue} area height={220} />
      </ChartCard>
    </Card>
  );
}

/** Daily uptime and latency across every monitored service. */
export function StatusCharts({ daily }: Readonly<StatusChartsProps>) {
  const t = useT();
  const measured = useMemo(() => daily.filter((day) => day.checks > 0), [daily]);
  const labels = useMemo(() => measured.map((day) => formatWith(day.date, 'd MMM')), [measured]);
  const uptime = useMemo<ChartData>(
    () => ({
      labels,
      series: [
        { id: 'uptime', label: t('Uptime'), values: measured.map((day) => day.uptimePercent) },
      ],
    }),
    [labels, measured, t],
  );
  const latency = useMemo<ChartData>(
    () => ({
      labels,
      series: [
        {
          id: 'response',
          label: t('Response time'),
          values: measured.map((day) => day.avgResponseMs),
        },
      ],
    }),
    [labels, measured, t],
  );

  if (measured.length === 0) {
    return (
      <Card variant="outlined" sx={{ p: 3 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('Daily charts appear once the monitor has collected a full day of checks.')}
        </Typography>
      </Card>
    );
  }

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <ChartPanel
          title={t('Daily uptime')}
          caption={t('Share of checks that succeeded, per day')}
          data={uptime}
          formatValue={formatPercent}
          labelHeading={t('Day')}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <ChartPanel
          title={t('Average response time')}
          caption={t('Mean round trip across all services, in milliseconds')}
          data={latency}
          formatValue={formatMs}
          labelHeading={t('Day')}
        />
      </Grid>
    </Grid>
  );
}
