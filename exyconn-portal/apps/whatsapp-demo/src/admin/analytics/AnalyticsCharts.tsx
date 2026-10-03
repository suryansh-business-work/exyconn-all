import { useMemo } from 'react';
import { useFormatters, useT } from '@exyconn/i18n';
import {
  BarChart,
  Box,
  ChartCard,
  Grid,
  TrendChart,
  type ValueFormatter,
} from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { countChart, dailyChart, type DemoStats } from './analytics.data';

/**
 * The period as pictures: activity per day, the industries people opened and the devices they
 * used. Every chart sits in a ChartCard, which gives it a heading and a table twin carrying the
 * same numbers for anyone who cannot read the fills.
 */
export function AnalyticsCharts({ stats }: Readonly<{ stats: DemoStats }>) {
  const t = useT();
  const { formatDate, formatNumber } = useFormatters();
  const formatCount: ValueFormatter = (value) => formatNumber(value);

  const daily = useMemo(() => dailyChart(stats.daily, formatDate, t), [stats.daily, formatDate, t]);
  const industries = useMemo(
    () => countChart(stats.topDemos, t('Times opened')),
    [stats.topDemos, t],
  );
  const devices = useMemo(() => countChart(stats.devices, t('Sessions')), [stats.devices, t]);

  return (
    <Grid container spacing={2}>
      <Grid size={12}>
        <Box sx={panel}>
          <ChartCard
            title={t('Activity per day')}
            subtitle={t('Sessions, and flows started and completed, each day of the period')}
            data={daily}
            formatValue={formatCount}
            labelHeading={t('Day')}
          >
            <TrendChart data={daily} formatValue={formatCount} integer />
          </ChartCard>
        </Box>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Box sx={[panel, { height: '100%' }]}>
          <ChartCard
            title={t('Top industries')}
            subtitle={t('How many times each industry demo was opened')}
            data={industries}
            formatValue={formatCount}
            labelHeading={t('Industry')}
            emptyText={t('No industry demo was opened in this period.')}
          >
            <BarChart data={industries} formatValue={formatCount} horizontal integer />
          </ChartCard>
        </Box>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Box sx={[panel, { height: '100%' }]}>
          <ChartCard
            title={t('Devices')}
            subtitle={t('Sessions by the kind of device the demo ran on')}
            data={devices}
            formatValue={formatCount}
            labelHeading={t('Device')}
            emptyText={t('No device was recorded in this period.')}
          >
            <BarChart data={devices} formatValue={formatCount} horizontal integer />
          </ChartCard>
        </Box>
      </Grid>
    </Grid>
  );
}
