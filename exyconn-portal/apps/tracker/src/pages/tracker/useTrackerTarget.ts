import { useTrackerExpectedQuery } from '@exyconn/shell/graphql/generated';
import { useMonthTarget } from '@exyconn/shell/pages/tracker-view/useMonthTarget';
import type { TrackerDayBucketData } from '@exyconn/shell/pages/tracker-view/tracker.types';

interface TargetArgs {
  employeeId: string | null;
  range: { from: string; to: string };
  timezone: string;
  /** The month's worked days, as the calendar already loaded them. */
  buckets: readonly TrackerDayBucketData[];
}

/**
 * The selected employee's month against their contract: what they were expected to work,
 * what they logged, the deficit so far, the leave they took and which finished days fell short.
 * The portal says what each day was worth; the comparison is shared (see useMonthTarget).
 */
export function useTrackerTarget({ employeeId, range, timezone, buckets }: TargetArgs) {
  const query = useTrackerExpectedQuery({
    variables: { userId: employeeId ?? '', ...range, timezone },
    skip: !employeeId,
  });
  const target = useMonthTarget(query.data?.trackerExpected, buckets, timezone);
  return { ...target, loading: query.loading, error: query.error };
}
