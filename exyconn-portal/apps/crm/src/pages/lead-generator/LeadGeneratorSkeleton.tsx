import { Grid } from '@exyconn/shell/components/ui';
import {
  FormSkeleton,
  ListSkeleton,
  SkeletonBone,
  SkeletonStatus,
} from '@exyconn/shell/components/feedback/skeletons';

/** The lead generator while its Maps config loads: search form and results beside the map. */
export function LeadGeneratorSkeleton() {
  return (
    <SkeletonStatus label="Loading the lead generator">
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 5 }}>
          <FormSkeleton fields={3} />
          <ListSkeleton toolbar={false} rows={4} columns={2} />
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <SkeletonBone
            variant="rounded"
            sx={{ height: { xs: 320, md: 'calc(100vh - 220px)' }, minHeight: 320 }}
          />
        </Grid>
      </Grid>
    </SkeletonStatus>
  );
}
