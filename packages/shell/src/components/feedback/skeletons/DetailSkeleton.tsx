import { Box, Grid, Stack } from '@/components/ui';
import { panel } from '../../glass/glass';
import { PageHeaderSkeleton } from './PageHeaderSkeleton';
import { PanelSkeleton } from './PanelSkeleton';
import { SkeletonBone } from './SkeletonBone';
import { SkeletonStatus } from './SkeletonStatus';
import { skeletonKeys } from './skeletonContext';

interface DetailSkeletonProps {
  /** Content panels in the main column. */
  blocks?: number;
  /** Draws the tab strip above the content. */
  tabs?: boolean;
  /** Draws the profile card beside the content; off for a detail page that is one column. */
  aside?: boolean;
  label?: string;
}

/** A record's page: its header, a profile card on the side, tabs, and the content panels. */
export function DetailSkeleton({
  blocks = 2,
  tabs = true,
  aside = true,
  label,
}: Readonly<DetailSkeletonProps>) {
  const mainCols = aside ? 8 : 12;
  return (
    <SkeletonStatus label={label}>
      <PageHeaderSkeleton />
      <Grid container spacing={2}>
        {aside ? (
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={[panel, { textAlign: 'center' }]} data-testid="skeleton-detail-aside">
              <SkeletonBone
                variant="circular"
                width={72}
                height={72}
                sx={{ mx: 'auto', mb: 1.5 }}
              />
              <SkeletonBone variant="text" sx={{ width: '60%', mx: 'auto' }} />
              <SkeletonBone variant="text" sx={{ width: '40%', mx: 'auto', mb: 2 }} />
              <PanelSkeleton lines={4} title={false} bare />
            </Box>
          </Grid>
        ) : null}
        <Grid size={{ xs: 12, md: mainCols }}>
          {tabs ? (
            <Stack direction="row" spacing={1} sx={{ mb: 2 }} data-testid="skeleton-detail-tabs">
              {skeletonKeys(3, 'tab').map((key) => (
                <SkeletonBone key={key} variant="rounded" sx={{ width: 88, height: 32 }} />
              ))}
            </Stack>
          ) : null}
          {skeletonKeys(blocks, 'block').map((key) => (
            <PanelSkeleton key={key} lines={4} />
          ))}
        </Grid>
      </Grid>
    </SkeletonStatus>
  );
}
