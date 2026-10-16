import { Divider, Stack } from '@exyconn/shell/components/ui';
import {
  PanelSkeleton,
  SkeletonBone,
  SkeletonStatus,
  skeletonKeys,
} from '@exyconn/shell/components/feedback/skeletons';
import { BookingFrame } from './BookingFrame';

/** A meeting's booking page while it loads: the summary beside the day-and-time picker. */
export function MeetingBookingSkeleton() {
  return (
    <SkeletonStatus label="Loading the meeting">
      <BookingFrame aside={<PanelSkeleton lines={4} bare />}>
        <SkeletonBone variant="text" sx={{ width: '40%', mb: 2 }} />
        <SkeletonBone variant="rounded" data-testid="skeleton-slot-picker" sx={{ height: 320 }} />
      </BookingFrame>
    </SkeletonStatus>
  );
}

/** A company's scheduling page while it loads: its name, the welcome line, then the meetings. */
export function BookingProfileSkeleton() {
  return (
    <SkeletonStatus label="Loading the scheduling page">
      <BookingFrame>
        <Stack spacing={1} sx={{ alignItems: 'center', mb: 3 }}>
          <SkeletonBone variant="text" sx={{ width: '40%', fontSize: 'h5.fontSize' }} />
          <SkeletonBone variant="text" sx={{ width: '70%' }} />
        </Stack>
        <Divider />
        <Stack divider={<Divider />}>
          {skeletonKeys(3, 'meeting').map((key) => (
            <PanelSkeleton key={key} lines={2} bare />
          ))}
        </Stack>
      </BookingFrame>
    </SkeletonStatus>
  );
}
