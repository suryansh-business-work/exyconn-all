import { useMemo } from 'react';
import { dayMarksOf, monthTarget, todayKeyIn, type MonthTarget } from '@exyconn/tracker-core';
import { useTrackerExpectedQuery } from '@exyconn/shell/graphql/generated';
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
 * what they logged, the deficit so far, the leave they took and which finished days fell short. The portal says
 * what each day was worth; the comparison is tracker-core's, so the desktop and phone
 * trackers draw the same red days.
 */
export function useTrackerTarget({ employeeId, range, timezone, buckets }: TargetArgs) {
  const query = useTrackerExpectedQuery({
    variables: { userId: employeeId ?? '', ...range, timezone },
    skip: !employeeId,
  });
  const contract = query.data?.trackerExpected;
  const target = useMemo<MonthTarget | null>(
    () => (contract ? monthTarget(contract, buckets, todayKeyIn(timezone)) : null),
    [contract, buckets, timezone],
  );
  const dayMarks = useMemo(() => (target ? dayMarksOf(target) : undefined), [target]);
  return {
    target,
    dayMarks,
    workHoursPerDay: query.data?.trackerExpected.workHoursPerDay ?? null,
    loading: query.loading,
    error: query.error,
  };
}
