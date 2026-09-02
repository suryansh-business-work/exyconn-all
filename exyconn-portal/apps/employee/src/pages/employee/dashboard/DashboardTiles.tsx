import { Grid } from '@exyconn/shell/components/ui';
import { StatCard, type StatItem } from '@exyconn/shell/components/dashboard/StatCard';

interface DashboardTilesProps {
  stats: StatItem[];
}

/** The tile row at the top of the employee dashboard. */
export function DashboardTiles({ stats }: Readonly<DashboardTilesProps>) {
  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      {stats.map((stat) => (
        <Grid key={stat.label} item xs={12} sm={6} md={4} lg={2}>
          <StatCard {...stat} />
        </Grid>
      ))}
    </Grid>
  );
}
