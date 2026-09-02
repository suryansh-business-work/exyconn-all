import type { ListWebsiteSubmissionsQuery } from '@exyconn/shell/graphql/generated';

export type WebsiteSubmissionRow = ListWebsiteSubmissionsQuery['listWebsiteSubmissions'][number];

export interface SubmissionTriageFormValues {
  status: string;
  notes: string;
}
