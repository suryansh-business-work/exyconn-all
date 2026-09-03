import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Grid, Stack, Typography } from '@/components/ui';
import { PageHeader } from '../layout/PageHeader';
import { StatCard, type StatItem } from './StatCard';
import { StatBreakdown, type BreakdownBucket } from './StatBreakdown';
import { glass } from '../glass/glass';

export interface OverviewBreakdown {
  title: string;
  buckets: BreakdownBucket[];
  accent?: string;
}

export interface OverviewLink {
  label: string;
  /** Path inside this app, e.g. "/crm/leads". */
  to: string;
}

interface ModuleOverviewProps {
  title: string;
  subtitle: string;
  stats: StatItem[];
  /** Up to two distributions, shown side by side. */
  breakdowns?: OverviewBreakdown[];
  links?: OverviewLink[];
  /** Heading above the recent-records table. */
  recentTitle?: string;
  children?: ReactNode;
}

/**
 * A module's landing page: the numbers, how they are distributed, where to go
 * next, and the newest records. It deliberately shows what a register cannot —
 * a register lists rows, this says what the rows add up to.
 */
export function ModuleOverview({
  title,
  subtitle,
  stats,
  breakdowns = [],
  links = [],
  recentTitle = 'Recent',
  children,
}: Readonly<ModuleOverviewProps>) {
  const navigate = useNavigate();
  const statCols = 12 / Math.min(Math.max(stats.length, 1), 4);
  const breakdownCols = 12 / Math.max(breakdowns.length, 1);

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />

      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        {stats.map((stat) => (
          <Grid key={stat.label} item xs={6} md={statCols}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {breakdowns.length > 0 && (
        <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
          {breakdowns.map((breakdown) => (
            <Grid key={breakdown.title} item xs={12} md={breakdownCols}>
              <StatBreakdown
                title={breakdown.title}
                buckets={breakdown.buckets}
                accent={breakdown.accent}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {links.length > 0 && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
          {links.map((link) => (
            <Button key={link.to} variant="outlined" onClick={() => navigate(link.to)}>
              {link.label}
            </Button>
          ))}
        </Stack>
      )}

      {children && (
        <Box sx={[glass, { p: 2 }]}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {recentTitle}
          </Typography>
          {children}
        </Box>
      )}
    </>
  );
}
