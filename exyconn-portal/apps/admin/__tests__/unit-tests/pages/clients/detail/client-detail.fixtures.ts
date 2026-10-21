import type { MockLink } from '@apollo/client/testing';
import {
  ClientCommunicationType,
  ClientDetailDocument,
  ClientLinksDocument,
  ClientSharedItemsDocument,
  ClientSharedKind,
  ClientStatus,
  ClientSummaryDocument,
} from '@exyconn/shell/graphql/generated';
import type {
  ClientCounts,
  ClientDetail,
} from '../../../../../src/pages/clients/detail/client-detail.types';
import type { ClientLinkRow } from '../../../../../src/pages/clients/detail/forms/client-link';
import type { ClientCommunicationRow } from '../../../../../src/pages/clients/detail/forms/client-communication';
import type { ClientSharedItemRow } from '../../../../../src/pages/clients/detail/forms/share-with-client';

export const CLIENT_ID = 'client-1';

export const clientDetail = (overrides: Partial<ClientDetail> = {}): ClientDetail => ({
  __typename: 'Client',
  id: CLIENT_ID,
  name: 'Dana Reyes',
  email: 'billing@acme.example',
  phone: '+1 555 0100',
  company: 'Acme',
  status: ClientStatus.Active,
  country: 'US',
  currency: 'USD',
  taxId: '12-3456789',
  taxIdLabel: 'EIN',
  city: 'Austin',
  region: 'TX',
  postalCode: '73301',
  billingAddress: '1 Main St',
  createdAt: '2026-01-15T00:00:00.000Z',
  ...overrides,
});

export const counts = (overrides: Partial<ClientCounts> = {}): ClientCounts => ({
  __typename: 'ClientSummary',
  contacts: 2,
  invoices: 5,
  openInvoices: 1,
  payments: 4,
  tickets: 3,
  openTickets: 1,
  projects: 2,
  links: 6,
  communications: 7,
  sharedItems: 8,
  ...overrides,
});

export const link = (overrides: Partial<ClientLinkRow> = {}): ClientLinkRow => ({
  __typename: 'ClientLink',
  id: 'link-1',
  clientId: CLIENT_ID,
  title: 'Staging site',
  url: 'https://staging.acme.example',
  description: 'Where we show work in progress',
  details: '',
  createdByName: 'Arjun',
  createdAt: '2026-10-01T00:00:00.000Z',
  ...overrides,
});

export const communication = (
  overrides: Partial<ClientCommunicationRow> = {},
): ClientCommunicationRow => ({
  __typename: 'ClientCommunication',
  id: 'comm-1',
  clientId: CLIENT_ID,
  type: ClientCommunicationType.Call,
  occurredAt: '2026-10-02T10:30:00.000Z',
  subject: 'Kick-off call',
  summary: 'Agreed the scope',
  details: '',
  participants: 'Dana, Arjun',
  loggedByName: 'Arjun',
  notifiedAt: null,
  ...overrides,
});

export const sharedItem = (overrides: Partial<ClientSharedItemRow> = {}): ClientSharedItemRow => ({
  __typename: 'ClientSharedItem',
  id: 'share-1',
  kind: ClientSharedKind.Contract,
  refId: 'contract-1',
  title: 'Master services agreement',
  status: 'ACTIVE',
  fileUrl: 'https://files.example/msa.pdf',
  hasContent: true,
  note: 'Signed copy',
  sharedByName: 'Arjun',
  sharedAt: '2026-10-03T00:00:00.000Z',
  effectiveDate: '2026-01-01T00:00:00.000Z',
  expiryDate: '2027-01-01T00:00:00.000Z',
  signedAt: '2026-02-01T00:00:00.000Z',
  signedBy: 'Dana Reyes',
  ...overrides,
});

export const detailAnswer = (client: ClientDetail = clientDetail()): MockLink.MockedResponse => ({
  request: { query: ClientDetailDocument, variables: { id: CLIENT_ID } },
  result: { data: { getClient: client } },
});

export const summaryAnswer = (summary: ClientCounts = counts()): MockLink.MockedResponse => ({
  request: { query: ClientSummaryDocument, variables: { clientId: CLIENT_ID } },
  result: { data: { clientSummary: summary } },
});

export const linksAnswer = (rows: ClientLinkRow[]): MockLink.MockedResponse => ({
  request: { query: ClientLinksDocument, variables: { clientId: CLIENT_ID } },
  result: { data: { clientLinks: rows } },
});

export const sharedAnswer = (rows: ClientSharedItemRow[]): MockLink.MockedResponse => ({
  request: { query: ClientSharedItemsDocument, variables: { clientId: CLIENT_ID } },
  result: { data: { clientSharedItems: rows } },
});
