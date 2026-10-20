import type { ListBugsQuery, BugSeverity, BugStatus } from '@exyconn/shell/graphql/generated';
import type { AttachmentItem } from '@exyconn/shell/components/upload';

export type BugRow = ListBugsQuery['listBugs'][number];

export interface BugFormValues {
  title: string;
  /** Rich text (HTML). */
  description: string;
  /** Rich text (HTML); empty when there are no steps. */
  stepsToReproduce: string;
  publicLink: string;
  privateLink: string;
  attachments: AttachmentItem[];
  severity: BugSeverity;
  status: BugStatus;
  projectId: string;
  /** Empty when nobody is fixing it yet. */
  assigneeId: string;
  /** Empty when the bug has no deadline. */
  dueDate: string;
}
