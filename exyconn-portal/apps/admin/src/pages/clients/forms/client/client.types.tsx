import type { ListClientsQuery, ClientStatus } from '@exyconn/shell/graphql/generated';

export type ClientRow = ListClientsQuery['listClients'][number];

export interface ClientFormValues {
  name: string;
  email: string;
  phone: string;
  company: string;
  status: ClientStatus;
}
