import type { WorkWeekQuery } from '@exyconn/shell/graphql/generated';

/** The workspace's working week, exactly as the query returns it. */
export type WorkWeekRow = WorkWeekQuery['workWeek'];

/** Form values: the weekdays people work unless HR gave them their own (0 is Sunday). */
export interface WorkWeekFormValues {
  days: number[];
}
