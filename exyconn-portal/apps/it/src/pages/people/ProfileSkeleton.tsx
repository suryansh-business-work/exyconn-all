import { Grid } from '@exyconn/shell/components/ui';
import {
  PanelSkeleton,
  SkeletonStatus,
  skeletonKeys,
} from '@exyconn/shell/components/feedback/skeletons';

/** An employee's IT profile while it loads: the facts panel, then the four sections in pairs. */
export function ProfileSkeleton() {
  return (
    <SkeletonStatus label="Loading the IT profile">
      <PanelSkeleton lines={4} title={false} />
      <Grid container spacing={2}>
        {skeletonKeys(4, 'section').map((key) => (
          <Grid key={key} size={{ xs: 12, md: 6 }}>
            <PanelSkeleton lines={3} />
          </Grid>
        ))}
      </Grid>
    </SkeletonStatus>
  );
}
