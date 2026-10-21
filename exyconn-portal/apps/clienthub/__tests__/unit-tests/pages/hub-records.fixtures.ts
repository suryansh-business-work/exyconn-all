import {
  ClientCommunicationType,
  ClientSharedKind,
  type ClientHubCommunicationsQuery,
  type ClientHubLinksQuery,
  type ClientHubSharedItemsQuery,
} from '@exyconn/shell/graphql/generated';

export const hubLink = (
  overrides: Partial<ClientHubLinksQuery['clientHubLinks'][number]> = {},
): ClientHubLinksQuery['clientHubLinks'][number] => ({
  id: 'link-1',
  clientId: 'client-1',
  title: 'Staging site',
  url: 'https://staging.acme.example',
  description: 'Work in progress',
  details: 'Sign in with Google',
  createdByName: 'Arjun',
  createdAt: '2026-10-01T00:00:00.000Z',
  ...overrides,
});

export const hubItem = (
  overrides: Partial<ClientHubSharedItemsQuery['clientHubSharedItems'][number]> = {},
): ClientHubSharedItemsQuery['clientHubSharedItems'][number] => ({
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
  effectiveDate: null,
  expiryDate: null,
  signedAt: null,
  signedBy: null,
  ...overrides,
});

export const hubEntry = (
  overrides: Partial<ClientHubCommunicationsQuery['clientHubCommunications']['rows'][number]> = {},
): ClientHubCommunicationsQuery['clientHubCommunications']['rows'][number] => ({
  id: 'comm-1',
  clientId: 'client-1',
  type: ClientCommunicationType.Meeting,
  occurredAt: '2026-10-02T10:30:00.000Z',
  subject: 'Quarterly review',
  summary: 'Agreed next steps',
  details: 'Ship phase two in November',
  participants: 'Dana, Arjun',
  loggedByName: 'Arjun',
  notifiedAt: null,
  ...overrides,
});
