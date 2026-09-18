import { MockedProvider } from '@apollo/client/testing/react';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { theme } from '@exyconn/shell/config/theme';
import { PlatformAnalyticsDocument } from '@exyconn/shell/graphql/generated';
import { UsersSection } from './UsersSection';
import { TrackerSection } from './TrackerSection';
import { PlatformSection } from './PlatformSection';

const metric = (label: string, value: number) => ({ __typename: 'AnalyticsMetric', label, value });
const point = (period: string, value: number) => ({ __typename: 'AnalyticsPoint', period, value });

const USERS = {
  total: 12,
  active: 10,
  inactive: 2,
  blocked: 1,
  onlineNow: 3,
  joined: 4,
  byRole: [metric('EMPLOYEE', 9), metric('ADMIN', 2)],
  joinedPerDay: [point('2026-09-17', 1), point('2026-09-18', 3)],
};

const TRACKER = {
  usersWithAccess: 7,
  consented: 6,
  activeDevices: 5,
  screenshots: 40,
  sessions: 22,
  trackedUsers: 4,
  activeHours: 31.5,
  idleHours: 4.5,
  activityPercent: 87.5,
  hoursPerDay: [point('2026-09-18', 31.5)],
  topUsers: [metric('Asha', 20)],
  topApps: [metric('Code', 12)],
  devicesByPlatform: [metric('darwin', 3), metric('win32', 2)],
  presence: [metric('WORKING', 4)],
  manualEntriesByStatus: [metric('PENDING', 1)],
};

const PLATFORM = {
  __typename: 'PlatformAnalytics',
  organizations: 3,
  activeOrganizations: 2,
  users: 40,
  employees: 31,
  trackedUsers: 9,
  organizationsByStatus: [metric('ACTIVE', 2), metric('SUSPENDED', 1)],
  organizationsByCountry: [metric('IN', 2), metric('DE', 1)],
  usersByOrganization: [metric('Exyconn', 30)],
  organizationsPerMonth: [point('2026-09', 1)],
};

const mount = (children: ReactNode, mocks: MockedProvider.Props['mocks'] = []) =>
  cy.mount(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </MockedProvider>,
  );

/** The stat tile labelled exactly `label`: its label row, then the big number under it. */
const tile = (label: string) => cy.contains(new RegExp(`^${label}$`)).parent().parent();

describe('Analytics sections', () => {
  it('shows the user totals and the roles chart', () => {
    mount(<UsersSection users={USERS} />);
    cy.contains('h2', 'Users').should('be.visible');
    tile('Online now').should('contain.text', '3');
    tile('Blocked').should('contain.text', '1');
    cy.contains('Users by role').should('be.visible');
    cy.contains('Users joined per day').should('be.visible');
  });

  it('shows tracker hours, activity and its charts', () => {
    mount(<TrackerSection tracker={TRACKER} />);
    tile('Active hours').should('contain.text', '31.5h');
    tile('Activity').should('contain.text', '88%');
    tile('Tracker access').should('contain.text', '7');
    cy.contains('Top applications').should('be.visible');
    cy.contains('Devices by platform').should('be.visible');
  });

  it('loads the platform figures for a super admin', () => {
    mount(<PlatformSection />, [
      {
        request: { query: PlatformAnalyticsDocument },
        result: { data: { platformAnalytics: PLATFORM } },
      },
    ]);
    tile('Organizations').should('contain.text', '3');
    cy.contains('Largest organizations').should('be.visible');
    cy.contains('Organizations by country').should('be.visible');
  });
});
