import { MockedProvider } from '@apollo/client/testing/react';
import type { MockLink } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import {
  ColdEmailTone,
  UpdateColdEmailVariantDocument,
  type ColdEmailVariantFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import { EditVariantForm } from './edit-variant.form';

const VERSION: ColdEmailVariantFieldsFragment = {
  id: 'v1',
  subject: 'A quick idea for Acme',
  body: 'Hello there',
  instruction: '',
  tone: ColdEmailTone.Friendly,
  costUsd: 0.001,
  createdAt: '2026-10-20T10:00:00.000Z',
  sentAt: null,
  sentMessageId: '',
};

const saved: MockLink.MockedResponse = {
  request: {
    query: UpdateColdEmailVariantDocument,
    variables: { draftId: 'draft-1', variantId: 'v1', subject: 'Checkout audit', body: 'Hi Acme' },
  },
  result: {
    data: {
      updateColdEmailVariant: {
        __typename: 'ColdEmailDraft',
        id: 'draft-1',
        object: 'COMPANY',
        recordId: 'co-1',
        recordName: 'Acme',
        toEmail: 'hello@acme.com',
        status: 'DRAFT',
        variantCount: 1,
        createdByName: 'Priya',
        updatedAt: '2026-10-20T10:00:00.000Z',
        goal: 'A free checkout audit',
        tone: 'FRIENDLY',
        createdAt: '2026-10-20T09:00:00.000Z',
        maxVariants: 10,
        variants: [
          {
            ...VERSION,
            __typename: 'ColdEmailVariant',
            subject: 'Checkout audit',
            body: 'Hi Acme',
          },
        ],
      },
    },
  },
};

const failed: MockLink.MockedResponse = {
  request: { query: UpdateColdEmailVariantDocument, variables: () => true },
  error: new Error('This version was already sent'),
};

const mount = (mocks: MockLink.MockedResponse[]) =>
  cy.mount(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <EditVariantForm
            draftId="draft-1"
            variant={VERSION}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('EditVariantForm', () => {
  it('starts from the version as written', () => {
    mount([]);
    cy.get('input[name="subject"]').should('have.value', 'A quick idea for Acme');
    cy.get('textarea[name="body"]').should('have.value', 'Hello there');
  });

  it('requires a subject and a message', () => {
    mount([]);
    cy.get('input[name="subject"]').clear().blur();
    cy.contains('Write a subject').should('be.visible');
    cy.get('textarea[name="body"]').clear().blur();
    cy.contains('Write the message').should('be.visible');
    cy.contains('button', 'Update').click();
    cy.get('@done').should('not.have.been.called');
  });

  it('keeps the subject under 200 characters', () => {
    mount([]);
    cy.get('input[name="subject"]').clear().type('x'.repeat(201), { delay: 0 }).blur();
    cy.contains('Keep the subject under 200 characters').should('be.visible');
  });

  it('saves the edited version, trimmed', () => {
    mount([saved]);
    cy.get('input[name="subject"]').clear().type('  Checkout audit ');
    cy.get('textarea[name="body"]').clear().type('Hi Acme');
    cy.contains('button', 'Update').click();
    cy.get('@done').should('have.been.calledOnce');
    cy.contains('Version saved').should('be.visible');
  });

  it('says why the version could not be saved and stays open', () => {
    mount([failed]);
    cy.contains('button', 'Update').click();
    cy.contains('This version was already sent').should('be.visible');
    cy.get('@done').should('not.have.been.called');
  });

  it('calls onCancel', () => {
    mount([]);
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
