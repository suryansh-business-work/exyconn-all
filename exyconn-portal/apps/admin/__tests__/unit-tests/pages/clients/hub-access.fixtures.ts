import type { MockLink } from '@apollo/client/testing';
import {
  ClientContactsDocument,
  ProjectStatus,
  type ListProjectsQuery,
} from '@exyconn/shell/graphql/generated';
import type { ClientContactRow } from '../../../../src/pages/clients/hub-access/forms/client-contact';

type Project = ListProjectsQuery['listProjects'][number];

/** Somebody at the client who may sign in to the client hub. */
export const contact = (overrides: Partial<ClientContactRow> = {}): ClientContactRow => ({
  __typename: 'ClientContact',
  id: 'contact-1',
  clientId: 'client-1',
  name: 'Meera Iyer',
  email: 'meera@acme.example',
  active: true,
  lastSignInAt: '2026-09-30T08:15:00.000Z',
  signInCount: 4,
  createdAt: '2026-09-01T00:00:00.000Z',
  ...overrides,
});

/** A project as the Projects list returns it. */
export const listedProject = (overrides: Partial<Project> = {}): Project => ({
  __typename: 'Project',
  id: 'project-1',
  name: 'Website',
  key: 'WEB',
  description: 'Marketing site',
  status: ProjectStatus.Active,
  startDate: '2026-01-01',
  endDate: null,
  clientId: null,
  clientName: '',
  budgetAmount: 5000,
  budgetHours: 120,
  ...overrides,
});

/** The people with access to client-1's hub, as the dialog reads them. */
export const contactsAnswer = (rows: ClientContactRow[]): MockLink.MockedResponse => ({
  request: { query: ClientContactsDocument, variables: { clientId: 'client-1' } },
  result: { data: { clientContacts: rows } },
});

/** Somebody who has never signed in and whose access is switched off. */
export const dormant = () =>
  contact({
    id: 'contact-2',
    name: 'Kiran Rao',
    email: 'kiran@acme.example',
    active: false,
    lastSignInAt: null,
    signInCount: 0,
  });
