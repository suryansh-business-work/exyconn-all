import { MockedProvider } from '@apollo/client/testing/react';
import type { MockedResponse } from '@apollo/client/testing';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { LocalizationProvider, AdapterDateFns } from '@exyconn/shell/components/ui';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { ConfirmProvider } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { theme } from '@exyconn/shell/config/theme';
import {
  SocialAccountsDocument,
  SocialAnalyticsDocument,
  SocialCalendarDocument,
  SocialMediaPostsDocument,
  SocialNetworkRulesDocument,
} from '@exyconn/shell/graphql/generated';
import { PostsTab } from './PostsTab';
import { CalendarTab } from './CalendarTab';
import { AnalyticsTab } from './AnalyticsTab';
import { monthRange } from './calendar.days';
import { ACCOUNTS, RULES, post } from './social.fixtures.cy';

const now = new Date();
const today = (hour: number) =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour).toISOString();

const mount = (children: ReactNode, mocks: MockedResponse[]) =>
  cy.mount(
    <MemoryRouter>
      <MockedProvider mocks={mocks}>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <NotificationProvider>
              <ConfirmProvider>{children}</ConfirmProvider>
            </NotificationProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </MockedProvider>
    </MemoryRouter>,
  );

const composerMocks: MockedResponse[] = [
  {
    request: { query: SocialAccountsDocument },
    result: { data: { socialAccounts: ACCOUNTS } },
    maxUsageCount: 5,
  },
  {
    request: { query: SocialNetworkRulesDocument },
    result: { data: { socialNetworkRules: RULES } },
    maxUsageCount: 5,
  },
];

describe('Social tabs', () => {
  it('lists posts with their numbers, and actions only for the unsent ones', () => {
    mount(<PostsTab />, [
      ...composerMocks,
      {
        request: {
          query: SocialMediaPostsDocument,
          variables: { accountId: null, status: null, limit: 200 },
        },
        result: {
          data: {
            socialMediaPosts: [
              post('p1'),
              post('p2', {
                origin: 'COMPOSED',
                status: 'FAILED',
                error: 'Token expired',
                publishedAt: null,
                permalink: '',
              }),
            ],
          },
        },
        maxUsageCount: 5,
      },
    ]);
    cy.contains('td', 'Post p1').should('be.visible');
    cy.contains('Token expired').should('be.visible');
    cy.get('button[aria-label="edit post"]').should('have.length', 1);
    cy.get('button[aria-label="open post on the network"]').should('have.length', 1);
  });

  it("puts this month's posts on their days, status in words", () => {
    const { from, to } = monthRange(new Date(now.getFullYear(), now.getMonth(), 1));
    mount(<CalendarTab />, [
      {
        request: {
          query: SocialCalendarDocument,
          variables: { from: from.toISOString(), to: to.toISOString() },
        },
        result: {
          data: {
            socialCalendar: [
              post('p1', { publishedAt: today(9) }),
              post('p2', {
                status: 'SCHEDULED',
                publishedAt: null,
                scheduledAt: today(15),
                network: 'X',
              }),
            ],
          },
        },
      },
    ]);
    cy.contains('Facebook 09:00 · Published').should('be.visible');
    cy.contains('X 15:00 · Scheduled').should('be.visible');
  });

  it('shows the totals, the charts and the AI panel', () => {
    mount(<AnalyticsTab />, [
      {
        request: { query: SocialAnalyticsDocument, variables: { days: 30 } },
        result: {
          data: {
            socialAnalytics: {
              __typename: 'SocialAnalytics',
              days: 30,
              posts: 2,
              likes: 18,
              comments: 4,
              shares: 2,
              views: 80,
              engagement: 24,
              scheduled: 1,
              failed: 0,
              byNetwork: [
                {
                  __typename: 'SocialNetworkStat',
                  network: 'FACEBOOK',
                  posts: 2,
                  engagement: 24,
                  views: 80,
                },
              ],
              engagementPerDay: [{ __typename: 'AnalyticsPoint', period: '2026-09-18', value: 24 }],
              topPosts: [post('p1')],
            },
          },
        },
      },
    ]);
    cy.contains('Engagement per day').should('be.visible');
    cy.contains('Engagement by network').should('be.visible');
    cy.contains('td', 'Post p1').should('be.visible');
    cy.contains('button', 'Analyse the last 30 days').should('be.visible');
    cy.contains('button', 'Generate ideas').should('be.disabled');
  });
});
