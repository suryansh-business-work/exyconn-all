import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import {
  SocialAppConfigsDocument,
  TestSocialAppConfigDocument,
} from '@exyconn/shell/graphql/generated';
import { SocialAppsPage } from './SocialAppsPage';

const app = (id: string, label: string, enabled: boolean) => ({
  __typename: 'SocialAppConfig',
  id,
  app: id,
  label,
  consoleUrl: 'https://example.com/console',
  callbackUrl: `https://portal-server.exyconn.com/oauth/social/${id.toLowerCase()}/callback`,
  clientId: enabled ? `${id.toLowerCase()}-client` : '',
  hasClientSecret: enabled,
  clientSecretHint: enabled ? '6789' : null,
  enabled,
});

const MOCKS = [
  {
    request: { query: SocialAppConfigsDocument },
    result: {
      data: {
        socialAppConfigs: [
          app('LINKEDIN', 'LinkedIn', false),
          app('META', 'Facebook + Instagram', true),
          app('X', 'X', false),
          app('YOUTUBE', 'YouTube', false),
        ],
      },
    },
    maxUsageCount: 3,
  },
  {
    request: { query: TestSocialAppConfigDocument, variables: { app: 'META' } },
    result: {
      data: {
        testSocialAppConfig: {
          __typename: 'SocialAppTest',
          ok: true,
          message: 'Facebook + Instagram recognised the app’s client ID and secret.',
        },
      },
    },
  },
];

describe('SocialAppsPage', () => {
  it('lists the four providers with their status, and opens one to set up', () => {
    cy.mount(
      <MockedProvider mocks={MOCKS}>
        <ThemeProvider theme={theme}>
          <NotificationProvider>
            <SocialAppsPage />
          </NotificationProvider>
        </ThemeProvider>
      </MockedProvider>,
    );
    cy.contains('h1, h2, h3, h4, h5, h6', 'Social apps').should('be.visible');
    cy.contains('td', 'Facebook + Instagram').should('be.visible');
    cy.contains('td', 'meta-client').should('be.visible');
    cy.contains('td', 'YouTube').should('be.visible');
    cy.get('button[aria-label="set up social app"]').first().click();
    cy.contains('https://portal-server.exyconn.com/oauth/social/linkedin/callback').should(
      'be.visible',
    );
  });
});

describe('SocialAppsPage test connection', () => {
  it('tests only a set-up app, and says what the provider answered', () => {
    cy.mount(
      <MockedProvider mocks={MOCKS}>
        <ThemeProvider theme={theme}>
          <NotificationProvider>
            <SocialAppsPage />
          </NotificationProvider>
        </ThemeProvider>
      </MockedProvider>,
    );
    cy.get('button[aria-label="test social app connection"]').should('have.length', 1).click();
    cy.contains('recognised the app’s client ID and secret').should('be.visible');
  });
});
