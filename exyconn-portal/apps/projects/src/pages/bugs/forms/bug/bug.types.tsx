import type { ListBugsQuery, BugSeverity, BugStatus } from '@exyconn/shell/graphql/generated';

export type BugRow = ListBugsQuery['listBugs'][number];

export interface BugFormValues {
  title: string;
  description: string;
  severity: BugSeverity;
  status: BugStatus;
  /** Empty when the bug is not on a project. */
  projectId: string;
  assigneeId: string;
  dueDate: string;
}
