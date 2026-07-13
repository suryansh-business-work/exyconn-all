import type { ListClientsQuery, ClientStatus } from '../../../../../graphql/generated';

export type ClientRow = ListClientsQuery['listClients'][number];

export interface ClientFormValues {
  name: string;
  email: string;
  phone: string;
  company: string;
  status: ClientStatus;
}
