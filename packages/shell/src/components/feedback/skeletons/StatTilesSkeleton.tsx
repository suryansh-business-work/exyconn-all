import { Box, Grid } from '@/components/ui';
import { panel } from '../../glass/glass';
import { SkeletonBone } from './SkeletonBone';
import { SkeletonStatus } from './SkeletonStatus';
import { skeletonKeys } from './skeletonContext';

interface StatTilesSkeletonProps {
  /** How many tiles the loaded page shows. */
  count?: number;
  label?: string;
}

/** A row of stat tiles — a caption over a number — as a dashboard's `StatCard`s draw them. */
export function StatTilesSkeleton({ count = 4, label }: Readonly<StatTilesSkeletonProps>) {
  const mdCols = 12 / Math.min(Math.max(count, 1), 4);
  return (
    <SkeletonStatus label={label} sx={{ mb: 3 }}>
      <Grid container spacing={2}>
        {skeletonKeys(count, 'tile').map((key) => (
          <Grid key={key} size={{ xs: 12, sm: 6, md: mdCols }}>
            <Box sx={panel} data-testid="skeleton-stat-tile">
              <SkeletonBone variant="text" sx={{ width: '50%' }} />
              <SkeletonBone variant="text" sx={{ width: '35%', fontSize: 'h4.fontSize' }} />
            </Box>
          </Grid>
        ))}
      </Grid>
    </SkeletonStatus>
  );
}
