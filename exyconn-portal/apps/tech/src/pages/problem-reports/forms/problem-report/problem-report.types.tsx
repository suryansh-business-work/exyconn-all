import type { ProblemReportFieldsFragment } from '@exyconn/shell/graphql/generated';

export type ProblemReportRow = ProblemReportFieldsFragment;

/** Everything the triage form edits — the reporter's fields plus Tech's own. */
export interface ProblemReportFormValues {
  serviceKey: string;
  category: string;
  severity: string;
  status: string;
  subject: string;
  description: string;
  reporterName: string;
  reporterEmail: string;
  pageUrl: string;
  assignee: string;
  resolutionNotes: string;
}
