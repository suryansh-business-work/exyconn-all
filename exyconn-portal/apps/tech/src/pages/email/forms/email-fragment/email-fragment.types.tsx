import type { EmailFragmentFieldsFragment } from '@exyconn/shell/graphql/generated';

export type EmailFragmentRow = EmailFragmentFieldsFragment;

export interface EmailFragmentFormValues {
  key: string;
  name: string;
  description: string;
  mjml: string;
}
