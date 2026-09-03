import type { ActivityFieldsFragment } from '@exyconn/shell/graphql/generated';

export type ActivityRow = ActivityFieldsFragment;

export interface ActivityFormValues {
  type: string;
  subject: string;
  notes: string;
  relatedType: string;
  relatedId: string;
  dueDate: Date | null;
  done: string;
  owner: string;
}
