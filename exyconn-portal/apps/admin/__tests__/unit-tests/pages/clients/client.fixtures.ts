import { ClientStatus, ClientTaxIdType } from '@exyconn/shell/graphql/generated';
import type { ClientRow } from '../../../../src/pages/clients/forms/client';
import type { ClientFormValues } from '../../../../src/pages/clients/forms/client/client.types';
import type { ClientProjectOption } from '../../../../src/pages/clients/forms/client/client-projects.fields';

/** A client as the grid hands it to the edit form. */
export const client = (overrides: Partial<ClientRow> = {}): ClientRow => ({
  __typename: 'Client',
  id: 'client-1',
  name: 'Priya Shah',
  email: 'priya@acme.example',
  phone: '+91 98765 43210',
  company: 'Acme',
  status: ClientStatus.Active,
  country: 'IN',
  currency: 'INR',
  taxIdType: ClientTaxIdType.InGst,
  taxId: '27AAPFU0939F1ZV',
  taxIdLabel: 'GSTIN',
  gstin: '27AAPFU0939F1ZV',
  stateCode: '27',
  region: 'Maharashtra',
  city: 'Mumbai',
  postalCode: '400001',
  billingAddress: '1 Marine Drive',
  ...overrides,
});

/** Form values for a valid new client with no tax number. */
export const clientValues = (overrides: Partial<ClientFormValues> = {}): ClientFormValues => ({
  name: 'Priya Shah',
  email: 'priya@acme.example',
  phone: '+91 98765 43210',
  company: 'Acme',
  status: ClientStatus.Prospect,
  country: '',
  region: '',
  city: '',
  postalCode: '',
  billingAddress: '',
  taxIdType: '',
  taxId: '',
  stateCode: '',
  currency: '',
  projectIds: [],
  ...overrides,
});

/** A project the client form can link. */
export const project = (overrides: Partial<ClientProjectOption> = {}): ClientProjectOption => ({
  __typename: 'ClientProjectOption',
  id: 'project-1',
  name: 'Website',
  key: 'WEB',
  clientId: '',
  clientName: '',
  ...overrides,
});
