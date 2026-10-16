import { Box, Grid, Stack } from '@/components/ui';
import { panel } from '../../glass/glass';
import { SkeletonBone } from './SkeletonBone';
import { SkeletonStatus } from './SkeletonStatus';
import { skeletonKeys } from './skeletonContext';

interface CardGridSkeletonProps {
  count?: number;
  /** Draws a round avatar at the top of each card — a person, an account, a project. */
  avatar?: boolean;
  label?: string;
}

/** A grid of record cards, one column on a phone and up to three on a desktop. */
export function CardGridSkeleton({
  count = 6,
  avatar = true,
  label,
}: Readonly<CardGridSkeletonProps>) {
  return (
    <SkeletonStatus label={label}>
      <Grid container spacing={2}>
        {skeletonKeys(count, 'card').map((key) => (
          <Grid key={key} size={{ xs: 12, sm: 6, md: 4 }}>
            <Box sx={panel} data-testid="skeleton-card">
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1.5 }}>
                {avatar ? <SkeletonBone variant="circular" width={40} height={40} /> : null}
                <Box sx={{ flex: 1 }}>
                  <SkeletonBone variant="text" sx={{ width: '70%' }} />
                  <SkeletonBone variant="text" sx={{ width: '45%' }} />
                </Box>
              </Stack>
              <SkeletonBone variant="rounded" sx={{ height: 64 }} />
            </Box>
          </Grid>
        ))}
      </Grid>
    </SkeletonStatus>
  );
}
