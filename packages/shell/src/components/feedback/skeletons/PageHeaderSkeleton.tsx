import { Box, Stack } from '@/components/ui';
import { SkeletonBone } from './SkeletonBone';
import { SkeletonStatus } from './SkeletonStatus';

interface PageHeaderSkeletonProps {
  /** Draws the primary action button on the right, as `PageHeader` does when it has one. */
  action?: boolean;
  label?: string;
}

/** The shape of `PageHeader`: a title, a subtitle under it, and the page's main action. */
export function PageHeaderSkeleton({ action = true, label }: Readonly<PageHeaderSkeletonProps>) {
  return (
    <SkeletonStatus label={label} sx={{ mb: 3 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <SkeletonBone variant="text" sx={{ width: '40%', fontSize: 'h4.fontSize' }} />
          <SkeletonBone variant="text" sx={{ width: '60%' }} />
        </Box>
        {action ? (
          <SkeletonBone
            variant="rounded"
            data-testid="skeleton-header-action"
            sx={{ width: 140, height: 36 }}
          />
        ) : null}
      </Stack>
    </SkeletonStatus>
  );
}
