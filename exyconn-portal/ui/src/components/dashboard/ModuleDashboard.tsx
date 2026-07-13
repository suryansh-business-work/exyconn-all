import type { ReactNode } from 'react';
import { Box, Chip, Grid, Stack, Typography } from '@/components/ui';
import { PageHeader } from '../layout/PageHeader';
import { StatCard, type StatItem } from './StatCard';
import { Sparkline } from '../data/Sparkline';
import { glass } from '../glass/glass';

interface ModuleDashboardProps {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  stats: StatItem[];
  /** Optional trend chart — omit for real, count-only dashboards. */
  chartTitle?: string;
  chartSeries?: number[];
  chartColor?: string;
  children: ReactNode; // the data table
  dialog?: ReactNode;
}

/** Shared glass dashboard scaffold: header → stat tiles → optional chart → table. */
export function ModuleDashboard({
  title,
  subtitle,
  actionLabel,
  onAction,
  stats,
  chartTitle,
  chartSeries,
  chartColor = '#f9851f',
  children,
  dialog,
}: ModuleDashboardProps) {
  const statCols = 12 / Math.min(Math.max(stats.length, 1), 4);
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} actionLabel={actionLabel} onAction={onAction} />

      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        {stats.map((stat) => (
          <Grid key={stat.label} item xs={6} md={statCols}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {chartSeries && (
        <Box sx={[glass, { p: 2, mb: 1.5 }]}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 0.5 }}
          >
            <Typography variant="subtitle2">{chartTitle}</Typography>
            <Chip label="Last 16 periods" size="small" variant="outlined" />
          </Stack>
          <Sparkline data={chartSeries} color={chartColor} height={96} />
        </Box>
      )}

      <Box sx={[glass, { p: { xs: 1, md: 1.5 } }]}>{children}</Box>
      {dialog}
    </>
  );
}
