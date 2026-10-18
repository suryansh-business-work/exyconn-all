import { Box, Divider, Stack } from '@exyconn/shell/components/ui';
import {
  SkeletonBone,
  SkeletonStatus,
  skeletonKeys,
} from '@exyconn/shell/components/feedback/skeletons';
import { DetailLayout } from './DetailLayout';

/** A label above its value, as DetailField lays one out. */
function FieldBones({ count, prefix }: Readonly<{ count: number; prefix: string }>) {
  return (
    <Stack spacing={1.5}>
      {skeletonKeys(count, prefix).map((key) => (
        <Stack key={key} spacing={0.5}>
          <SkeletonBone variant="text" sx={{ width: 72, fontSize: 'caption.fontSize' }} />
          <SkeletonBone variant="text" sx={{ width: '65%' }} />
        </Stack>
      ))}
    </Stack>
  );
}

/** The left column: avatar and name, the quick actions, the details and the map. */
function ProfileBones() {
  return (
    <Stack spacing={2} data-testid="skeleton-record-profile">
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <SkeletonBone variant="rounded" width={56} height={56} />
        <Stack spacing={0.5} sx={{ flex: 1 }}>
          <SkeletonBone variant="text" sx={{ width: '70%', fontSize: 'h6.fontSize' }} />
          <SkeletonBone variant="text" sx={{ width: '50%' }} />
          <SkeletonBone variant="rounded" sx={{ width: 76, height: 22 }} />
        </Stack>
      </Stack>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {skeletonKeys(4, 'action').map((key) => (
          <SkeletonBone key={key} variant="rounded" sx={{ width: 84, height: 34 }} />
        ))}
      </Box>
      <Divider />
      <SkeletonBone variant="text" sx={{ width: '45%' }} />
      <FieldBones count={5} prefix="profile-field" />
      <SkeletonBone variant="rounded" sx={{ width: '100%', height: 180 }} />
    </Stack>
  );
}

/** One timeline entry: its icon, then a title line and a detail line. */
function TimelineBones() {
  return (
    <Stack spacing={2}>
      {skeletonKeys(3, 'timeline').map((key) => (
        <Stack key={key} direction="row" spacing={1.5}>
          <SkeletonBone variant="circular" width={28} height={28} />
          <Stack spacing={0.5} sx={{ flex: 1 }}>
            <SkeletonBone variant="text" sx={{ width: '40%' }} />
            <SkeletonBone variant="text" sx={{ width: '85%' }} />
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
}

/** A record's page while it loads, shaped like the page it becomes. */
export function RecordDetailSkeleton({ label }: Readonly<{ label: string }>) {
  return (
    <SkeletonStatus label={label}>
      <DetailLayout aside={<ProfileBones />}>
        <Stack spacing={3}>
          <Stack direction="row" spacing={1}>
            {skeletonKeys(4, 'tab').map((key) => (
              <SkeletonBone key={key} variant="rounded" sx={{ width: 88, height: 34 }} />
            ))}
          </Stack>
          <SkeletonBone variant="rounded" sx={{ width: '100%', height: 88 }} />
          <SkeletonBone variant="text" sx={{ width: 160 }} />
          <FieldBones count={5} prefix="overview-field" />
          <Divider />
          <SkeletonBone variant="text" sx={{ width: 140 }} />
          <TimelineBones />
        </Stack>
      </DetailLayout>
    </SkeletonStatus>
  );
}
