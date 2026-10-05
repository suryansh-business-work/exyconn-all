import type { ClientContactsQuery } from '@exyconn/shell/graphql/generated';

export type ClientContactRow = ClientContactsQuery['clientContacts'][number];

export interface ClientContactFormValues {
  name: string;
  email: string;
}
