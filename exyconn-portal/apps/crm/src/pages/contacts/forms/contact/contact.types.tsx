import type { ContactFieldsFragment } from '@exyconn/shell/graphql/generated';

export type ContactRow = ContactFieldsFragment;

export interface ContactFormValues {
  name: string;
  email: string;
  phone: string;
  title: string;
  companyId: string;
  status: string;
  owner: string;
  notes: string;
}
