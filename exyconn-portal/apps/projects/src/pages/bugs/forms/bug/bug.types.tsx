import type { ListBugsQuery, BugSeverity, BugStatus } from '@exyconn/shell/graphql/generated';

export type BugRow = ListBugsQuery['listBugs'][number];

export interface BugFormValues {
  title: string;
  description: string;
  severity: BugSeverity;
  status: BugStatus;
  assignee: string;
  dueDate: string;
}
