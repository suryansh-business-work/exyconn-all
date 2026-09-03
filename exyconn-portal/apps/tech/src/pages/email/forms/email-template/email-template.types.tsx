import type { EmailTemplateFieldsFragment } from '@exyconn/shell/graphql/generated';

export type EmailTemplateRow = EmailTemplateFieldsFragment;

export interface EmailTemplateFormValues {
  key: string;
  name: string;
  description: string;
  subject: string;
  mjml: string;
  isActive: boolean;
}
