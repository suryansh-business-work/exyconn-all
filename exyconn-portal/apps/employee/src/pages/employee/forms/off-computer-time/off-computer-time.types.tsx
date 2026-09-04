import type { MyTrackerManualEntriesQuery } from '@exyconn/shell/graphql/generated';

/** One off-computer entry as the employee's own list returns it. */
export type OffComputerEntryRow = MyTrackerManualEntriesQuery['myTrackerManualEntries'][number];

/** What the claim form collects before it becomes a TrackerManualEntryInput. */
export interface OffComputerTimeFormValues {
  /** ISO strings — the pickers store them that way, the mutation takes DateTime. */
  startedAt: string;
  endedAt: string;
  projectId: string;
  note: string;
}
