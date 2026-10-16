import { Grid } from '@/components/ui';
import { ChartSkeleton } from './ChartSkeleton';
import { SkeletonStatus } from './SkeletonStatus';
import { StatTilesSkeleton } from './StatTilesSkeleton';
import { skeletonKeys } from './skeletonContext';

interface DashboardSkeletonProps {
  tiles?: number;
  /** Chart panels under the tiles, two to a row on a desktop. */
  charts?: number;
  label?: string;
}

/** An analytics page: a row of stat tiles, then its charts. */
export function DashboardSkeleton({
  tiles = 4,
  charts = 2,
  label,
}: Readonly<DashboardSkeletonProps>) {
  return (
    <SkeletonStatus label={label}>
      <StatTilesSkeleton count={tiles} />
      <Grid container spacing={1.5}>
        {skeletonKeys(charts, 'chart').map((key) => (
          <Grid key={key} size={{ xs: 12, md: 6 }}>
            <ChartSkeleton />
          </Grid>
        ))}
      </Grid>
    </SkeletonStatus>
  );
}
