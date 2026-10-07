import type { MockLink } from '@apollo/client/testing';
import {
  MilestoneState,
  ProjectStatus,
  SharedProjectDocument,
} from '@exyconn/shell/graphql/generated';
import type { SharedProjectView } from '../../../../src/pages/project';

export const TOKEN = 'share-token-1';

export const sharedProject = (overrides: Partial<SharedProjectView> = {}): SharedProjectView => ({
  __typename: 'SharedProjectView',
  name: 'Website relaunch',
  clientName: 'Acme',
  status: ProjectStatus.OnHold,
  startDate: '2026-01-01',
  endDate: null,
  budgetHours: 40,
  trackedHours: 12.5,
  milestones: [
    {
      __typename: 'SharedMilestone',
      name: 'Design sign-off',
      dueOn: '2026-03-01',
      state: MilestoneState.Hit,
    },
  ],
  ticketCounts: [{ __typename: 'SharedTicketCount', status: 'OPEN', count: 2 }],
  ...overrides,
});

export const projectLookup = (value: SharedProjectView | null): MockLink.MockedResponse => ({
  request: { query: SharedProjectDocument, variables: { token: TOKEN } },
  result: { data: { sharedProject: value } },
});
