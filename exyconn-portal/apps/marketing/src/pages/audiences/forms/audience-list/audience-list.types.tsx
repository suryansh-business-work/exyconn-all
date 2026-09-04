import type { AudienceListFieldsFragment } from '@exyconn/shell/graphql/generated';

export type AudienceRow = AudienceListFieldsFragment;

export interface AudienceListFormValues {
  name: string;
  description: string;
  clientIds: string[];
}
