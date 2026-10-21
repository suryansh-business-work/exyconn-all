import { Box } from '@exyconn/shell/components/ui';
import {
  SkeletonBone,
  SkeletonStatus,
  skeletonKeys,
} from '@exyconn/shell/components/feedback/skeletons';

/** Six weeks of seven days: the most a month grid draws. */
const DAY_KEYS = skeletonKeys(42, 'day');

/** The calendar while its meetings load. */
export function CalendarSkeleton() {
  return (
    <SkeletonStatus label="Loading calendar">
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 0.5 }}>
        {DAY_KEYS.map((key) => (
          <SkeletonBone key={key} variant="rounded" sx={{ height: { xs: 64, sm: 104 } }} />
        ))}
      </Box>
    </SkeletonStatus>
  );
}
