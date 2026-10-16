import { Box, Stack } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import {
  SkeletonBone,
  SkeletonStatus,
  skeletonKeys,
} from '@exyconn/shell/components/feedback/skeletons';

/** The pipeline board while the deals load: one column per stage, a few cards in each. */
export function DealBoardSkeleton({ stages }: Readonly<{ stages: readonly string[] }>) {
  return (
    <SkeletonStatus label="Loading the pipeline">
      <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1 }}>
        {stages.map((stage) => (
          <Box
            key={stage}
            data-testid="skeleton-deal-column"
            sx={[panel, { minWidth: 240, flex: '1 0 240px' }]}
          >
            <SkeletonBone variant="text" sx={{ width: '50%', mb: 1 }} />
            <Stack spacing={1}>
              {skeletonKeys(2, `${stage}-card`).map((key) => (
                <SkeletonBone key={key} variant="rounded" sx={{ height: 72 }} />
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>
    </SkeletonStatus>
  );
}
