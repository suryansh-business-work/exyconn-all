import { MockedProvider } from '@apollo/client/testing/react';
import type { MockLink } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import {
  CreateMarketingSuppressionDocument,
  MarketingSuppressionLookupDocument,
} from '@exyconn/shell/graphql/generated';
import { SuppressionForm } from './suppression.form';

const EXISTING = {
  __typename: 'MarketingSuppression',
  id: 'suppression-1',
  email: 'gone@acme.io',
  reason: 'UNSUBSCRIBED',
  source: 'Footer link',
  origin: 'SUBSCRIBER',
  scope: 'ORGANIZATION_MARKETING',
  note: '',
  addedByName: '',
  archivedAt: null,
  createdAt: '2026-09-01T10:00:00.000Z',
};

const GRACE = {
  __typename: 'SuppressionLink',
  kind: 'CONTACT',
  id: 'contact-1',
  name: 'Grace Hopper',
  emails: ['gone@acme.io', 'grace@home.io'],
};

const lookedUp = (existing: typeof EXISTING | null): MockLink.MockedResponse => ({
  request: { query: MarketingSuppressionLookupDocument, variables: { email: 'gone@acme.io' } },
  result: {
    data: {
      marketingSuppressionLookup: {
        __typename: 'MarketingSuppressionLookup',
        email: 'gone@acme.io',
        existing,
        linkedRecords: [GRACE],
      },
    },
  },
});

const created: MockLink.MockedResponse = {
  request: {
    query: CreateMarketingSuppressionDocument,
    variables: {
      input: { email: 'gone@acme.io', reason: 'MANUAL', note: 'Asked by phone', archived: false },
    },
  },
  result: {
    data: {
      createMarketingSuppression: { __typename: 'MarketingSuppression', id: 'suppression-2' },
    },
  },
};

const mount = (mocks: MockLink.MockedResponse[] = []) =>
  cy.mount(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <main>
            <SuppressionForm onDone={cy.stub().as('done')} onCancel={cy.stub().as('cancel')} />
          </main>
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('SuppressionForm', () => {
  it('requires an email address', () => {
    mount();
    cy.contains('button', 'Add address').click();
    cy.contains('Email is required').should('be.visible');
    cy.get('@done').should('not.have.been.called');
  });

  it('rejects a malformed address', () => {
    mount();
    cy.get('input[name="email"]').type('not-an-email');
    cy.contains('button', 'Add address').click();
    cy.contains('Enter a valid email address').should('be.visible');
  });

  it('says what adding the address means and records it as an admin action', () => {
    mount();
    cy.contains('This address will be excluded from all marketing campaigns').should('be.visible');
    cy.contains('Transactional emails such as sign-in codes and invoices are not affected.').should(
      'be.visible',
    );
    cy.get('input[value="Admin"]').should('be.disabled');
    cy.get('input[value="Organization-wide marketing"]').should('be.disabled');
  });

  it('shows the CRM records holding the address, then adds it', () => {
    mount([lookedUp(null), created]);
    cy.get('input[name="email"]').type('gone@acme.io');
    cy.contains('Found in the CRM').should('be.visible');
    cy.contains('Grace Hopper').should('be.visible');
    cy.contains('grace@home.io').should('be.visible');
    cy.get('textarea[name="note"]').type('Asked by phone');
    cy.contains('14/500').should('be.visible');
    cy.contains('button', 'Add address').click();
    cy.get('@done').should('have.been.calledOnce');
    cy.contains('gone@acme.io added to the suppression list').should('be.visible');
  });

  it('refuses an address that is already on the list', () => {
    mount([lookedUp(EXISTING)]);
    cy.get('input[name="email"]').type('gone@acme.io');
    cy.contains('gone@acme.io is already on the suppression list.').should('be.visible');
    cy.contains('button', 'Add address').click();
    cy.contains('This address is already on the suppression list').should('be.visible');
    cy.get('@done').should('not.have.been.called');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
