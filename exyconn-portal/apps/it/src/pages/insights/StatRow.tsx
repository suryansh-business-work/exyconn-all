import { Grid } from '@exyconn/shell/components/ui';
import { StatCard, type StatItem } from '@exyconn/shell/components/dashboard/StatCard';

/** A row of up to four stat tiles, two per line on a phone. */
export function StatRow({ stats }: Readonly<{ stats: readonly StatItem[] }>) {
  return (
    <Grid container spacing={1.5}>
      {stats.map((stat) => (
        <Grid key={stat.label} size={{ xs: 6, md: 12 / Math.min(Math.max(stats.length, 1), 4) }}>
          <StatCard {...stat} />
        </Grid>
      ))}
    </Grid>
  );
}
