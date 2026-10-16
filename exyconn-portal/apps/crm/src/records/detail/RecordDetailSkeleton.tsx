import { Stack } from '@exyconn/shell/components/ui';
import {
  PanelSkeleton,
  SkeletonBone,
  SkeletonStatus,
  skeletonKeys,
} from '@exyconn/shell/components/feedback/skeletons';
import { DetailLayout } from './DetailLayout';

/** A record's page while it loads: the profile card beside the tab strip and its content. */
export function RecordDetailSkeleton({ label }: Readonly<{ label: string }>) {
  return (
    <SkeletonStatus label={label}>
      <DetailLayout
        aside={
          <Stack spacing={1} sx={{ alignItems: 'center' }} data-testid="skeleton-record-profile">
            <SkeletonBone variant="circular" width={72} height={72} />
            <SkeletonBone variant="text" sx={{ width: '60%' }} />
            <SkeletonBone variant="text" sx={{ width: '40%', mb: 2 }} />
            <PanelSkeleton lines={5} title={false} bare />
          </Stack>
        }
      >
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          {skeletonKeys(3, 'tab').map((key) => (
            <SkeletonBone key={key} variant="rounded" sx={{ width: 88, height: 32 }} />
          ))}
        </Stack>
        <PanelSkeleton lines={4} bare />
      </DetailLayout>
    </SkeletonStatus>
  );
}
