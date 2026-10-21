import { MockedProvider } from '@apollo/client/testing/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { theme } from '@exyconn/shell/config/theme';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { ConfirmProvider } from '@exyconn/shell/components/feedback/ConfirmProvider';
import {
  SetSocialAccountActiveDocument,
  SocialAccountsDocument,
  SocialAppStatusesDocument,
} from '@exyconn/shell/graphql/generated';
import { AccountsTab } from './AccountsTab';
import { account } from '../../../cypress/support/social.fixtures';

const status = (
  app: string,
  label: string,
  available: boolean,
  networks: string[],
  pagesRefused = false,
) => ({
  __typename: 'SocialAppStatus',
  app,
  label,
  available,
  networks,
  pagesRefused,
});

const MOCKS = [
  {
    request: { query: SocialAppStatusesDocument },
    result: {
      data: {
        socialAppStatuses: [
          status('LINKEDIN', 'LinkedIn', false, ['LINKEDIN'], true),
          status('META', 'Facebook + Instagram', true, ['FACEBOOK', 'INSTAGRAM']),
          status('THREADS', 'Threads', true, ['THREADS']),
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
          account('a1', 'INSTAGRAM', 'exyconn', { handle: '@exyconn' }),
          account('li-1', 'LINKEDIN', 'Suryansh', { needsReconnect: true }),
          account('li-2', 'LINKEDIN', 'Exyconn Page', {
            handle: 'exyconn',
            kind: 'ORGANIZATION',
            active: false,
          }),
        ],
      },
    },
    maxUsageCount: 5,
  },
  {
    request: { query: SetSocialAccountActiveDocument, variables: { id: 'a1', active: false } },
    result: {
      data: { setSocialAccountActive: { __typename: 'SocialAccount', id: 'a1', active: false } },
    },
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
    // The name sits beside the brand marks; the "Adds" line is the card's own text.
    cy.contains('Adds: Facebook Pages').parent().find('button').should('not.be.disabled');
    cy.contains('Adds: LinkedIn profile').parent().find('button').should('be.disabled');
    cy.contains('Not set up yet').should('be.visible');
    cy.contains('Adds: Facebook Pages, Instagram Business').should('be.visible');
    cy.contains('Adds: LinkedIn profile and company pages').should('be.visible');
    cy.contains('LinkedIn has not approved company pages for this app yet.').should('be.visible');
  });

  it('offers Threads, with its own app', () => {
    mount();
    cy.contains('Adds: Threads profile').should('be.visible');
    cy.contains('Adds: Threads profile').parent().find('button').should('not.be.disabled');
  });

  it('lists connected accounts', () => {
    mount();
    cy.contains('td', '@exyconn').should('be.visible');
    cy.contains('Does not expire').should('be.visible');
  });

  it('marks each network with its icon, named for screen readers', () => {
    mount();
    cy.get('svg[role="img"]').contains('title', 'exyconn · Instagram').should('exist');
    cy.get('svg[role="img"]').contains('title', 'Exyconn Page · LinkedIn page').should('exist');
  });

  it('asks an older LinkedIn connection to reconnect, and shows a paused page as paused', () => {
    mount();
    cy.contains('tr', 'Suryansh').should(
      'contain.text',
      'Reconnect LinkedIn to add your company pages',
    );
    cy.contains('tr', 'Exyconn Page').should('contain.text', 'Paused');
    cy.get('input[aria-label="Active: Exyconn Page · LinkedIn page"]').should('not.be.checked');
  });

  it('pauses an account from its switch', () => {
    mount();
    cy.get('input[aria-label="Active: exyconn · Instagram"]').should('be.checked').click();
    cy.contains('exyconn is paused').should('be.visible');
  });

  it('announces what the provider sent back', () => {
    mount('/marketing/social?error=Meta%20refused%20the%20connection');
    cy.contains('Meta refused the connection').should('be.visible');
  });
});
