import { useMemo } from 'react';
import { getDay, parseISO } from 'date-fns';
import { dayMarksOf, monthTarget, todayKeyIn, type MonthTarget } from '@exyconn/tracker-core';
import type { TrackerExpectedFieldsFragment } from '@/graphql/generated';
import type { TrackerDayBucketData } from './tracker.types';

/**
 * The weekdays the employee works, read off the month's contract: a weekday is off when any of
 * its days is the employee's week off. A month has every weekday at least four times, so a
 * holiday on one of them cannot hide which kind of day it is.
 */
function workDaysOf(days: ReadonlyArray<{ date: string; offReason?: string | null }>): number[] {
  const off = new Set(
    days.filter((day) => day.offReason === 'WEEKEND').map((day) => getDay(parseISO(day.date))),
  );
  return [0, 1, 2, 3, 4, 5, 6].filter((weekday) => !off.has(weekday));
}

/**
 * A month's worked days against its contract: what was expected, what was logged, the leave and
 * holidays, and which finished days fell short. The comparison is tracker-core's, so the HR view,
 * My Tracker and the desktop and phone trackers draw the same marks. The caller loads the
 * contract — HR asks for an employee's (`trackerExpected`), an employee for their own
 * (`myTrackerExpected`).
 */
export function useMonthTarget(
  contract: TrackerExpectedFieldsFragment | undefined,
  buckets: readonly TrackerDayBucketData[],
  timezone: string,
) {
  const target = useMemo<MonthTarget | null>(
    () => (contract ? monthTarget(contract, buckets, todayKeyIn(timezone)) : null),
    [contract, buckets, timezone],
  );
  const dayMarks = useMemo(() => (target ? dayMarksOf(target) : undefined), [target]);
  const workDays = useMemo(() => (contract ? workDaysOf(contract.days) : null), [contract]);
  return {
    target,
    dayMarks,
    dayLabels: target?.offLabels,
    workDays,
    workHoursPerDay: contract?.workHoursPerDay ?? null,
  };
}
