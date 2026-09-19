import { MockedProvider } from '@apollo/client/testing/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { theme } from '@exyconn/shell/config/theme';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { ConfirmProvider } from '@exyconn/shell/components/feedback/ConfirmProvider';
import {
  SocialAccountsDocument,
  SocialAppStatusesDocument,
} from '@exyconn/shell/graphql/generated';
import { AccountsTab } from './AccountsTab';

const status = (app: string, label: string, available: boolean, networks: string[]) => ({
  __typename: 'SocialAppStatus',
  app,
  label,
  available,
  networks,
});

const MOCKS = [
  {
    request: { query: SocialAppStatusesDocument },
    result: {
      data: {
        socialAppStatuses: [
          status('LINKEDIN', 'LinkedIn', false, ['LINKEDIN']),
          status('META', 'Facebook + Instagram', true, ['FACEBOOK', 'INSTAGRAM']),
        ],
      },
    },
    maxUsageCount: 5,
  },
  {
    request: { query: SocialAccountsDocument },
    result: {
      data: {
        socialAccounts: [
          {
            __typename: 'SocialAccount',
            id: 'a1',
            network: 'INSTAGRAM',
            app: 'META',
            name: 'exyconn',
            handle: '@exyconn',
            avatarUrl: '',
            expiresAt: null,
            createdAt: '2026-09-19T00:00:00.000Z',
          },
        ],
      },
    },
    maxUsageCount: 5,
  },
];

const mount = (url = '/marketing/social') =>
  cy.mount(
    <MemoryRouter initialEntries={[url]}>
      <MockedProvider mocks={MOCKS}>
        <ThemeProvider theme={theme}>
          <NotificationProvider>
            <ConfirmProvider>
              <AccountsTab />
            </ConfirmProvider>
          </NotificationProvider>
        </ThemeProvider>
      </MockedProvider>
    </MemoryRouter>,
  );

describe('AccountsTab', () => {
  it('offers Connect only for providers Tech has set up', () => {
    mount();
    cy.contains('Facebook + Instagram').parent().find('button').should('not.be.disabled');
    cy.contains('LinkedIn').parent().find('button').should('be.disabled');
    cy.contains('Not set up yet').should('be.visible');
    cy.contains('Adds: Facebook Pages, Instagram Business').should('be.visible');
  });

  it('lists connected accounts', () => {
    mount();
    cy.contains('td', '@exyconn').should('be.visible');
    cy.contains('Does not expire').should('be.visible');
  });

  it('announces what the provider sent back', () => {
    mount('/marketing/social?error=Meta%20refused%20the%20connection');
    cy.contains('Meta refused the connection').should('be.visible');
  });
});
