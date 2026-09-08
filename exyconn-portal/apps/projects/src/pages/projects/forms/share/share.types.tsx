import type { ProjectShareFieldsFragment } from '@exyconn/shell/graphql/generated';

export type ProjectShareRow = ProjectShareFieldsFragment;

/** What the share form collects. The token and the expiry date are the server's to decide. */
export interface ShareFormValues {
  label: string;
  expiresInDays: string;
}
