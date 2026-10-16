import { Box } from '@exyconn/shell/components/ui';
import {
  SkeletonBone,
  SkeletonStatus,
  skeletonKeys,
} from '@exyconn/shell/components/feedback/skeletons';

/** Six weeks of seven days — the most a month grid ever draws. */
const DAY_KEYS = skeletonKeys(42, 'day');
const WEEKDAY_KEYS = skeletonKeys(7, 'weekday');

/** The month grid while its posts load: the weekday row, then a cell per day. */
export function CalendarSkeleton() {
  return (
    <SkeletonStatus label="Loading calendar">
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 0.5 }}>
        {WEEKDAY_KEYS.map((key) => (
          <SkeletonBone key={key} variant="text" sx={{ mx: 'auto', width: '50%' }} />
        ))}
        {DAY_KEYS.map((key) => (
          <SkeletonBone key={key} variant="rounded" sx={{ height: { xs: 64, sm: 96 } }} />
        ))}
      </Box>
    </SkeletonStatus>
  );
}
