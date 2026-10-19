import { MockedProvider } from '@apollo/client/testing/react';
import type { MockLink } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { AddMarketingSuppressionsDocument } from '@exyconn/shell/graphql/generated';
import { BulkSuppressionForm } from './bulk-suppression.form';

interface BulkInput {
  emails: string[];
  reason: string;
  note: string;
  fromFile: boolean;
}

const added = (fromFile: boolean): MockLink.MockedResponse => ({
  request: {
    query: AddMarketingSuppressionsDocument,
    variables: ({ input }: { input: BulkInput }) =>
      input.emails.join(',') === 'ada@acme.io,grace@navy.mil' &&
      input.reason === 'MANUAL' &&
      input.fromFile === fromFile,
  },
  result: {
    data: {
      addMarketingSuppressions: {
        __typename: 'MarketingSuppressionsResult',
        added: ['ada@acme.io'],
        alreadySuppressed: ['grace@navy.mil'],
        invalid: [],
      },
    },
  },
});

const failed: MockLink.MockedResponse = {
  request: { query: AddMarketingSuppressionsDocument, variables: () => true },
  error: new Error('Too many addresses today'),
};

const mount = (mocks: MockLink.MockedResponse[] = []) =>
  cy.mount(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <main>
            <BulkSuppressionForm onDone={cy.stub().as('done')} onCancel={cy.stub().as('cancel')} />
          </main>
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('BulkSuppressionForm', () => {
  it('asks for addresses before sending anything', () => {
    mount();
    cy.contains('button', 'Suppress addresses').click();
    cy.contains('Paste some addresses or choose a CSV file').should('be.visible');
    cy.get('@done').should('not.have.been.called');
  });

  it('refuses text with no valid address', () => {
    mount();
    cy.get('textarea[name="addresses"]').type('nobody here, broken@');
    cy.contains('button', 'Suppress addresses').click();
    cy.contains('Add between 1 and 5000 valid addresses').should('be.visible');
  });

  it('previews the pasted addresses and sends the unique valid ones', () => {
    mount([added(false)]);
    cy.get('textarea[name="addresses"]').type(
      'Ada@acme.io, grace@navy.mil{enter}ada@acme.io{enter}broken@',
    );
    cy.contains('2 valid unique address(es), 1 invalid, 1 repeated.').should('be.visible');
    cy.contains('button', 'Suppress addresses').click();
    cy.get('@done').should('have.been.calledOnce');
    cy.contains('1 added, 1 already suppressed, 0 invalid').should('be.visible');
  });

  it('reads the addresses from a chosen CSV file', () => {
    mount([added(true)]);
    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from('name,email\nAda,ada@acme.io\nGrace,grace@navy.mil'),
        fileName: 'list.csv',
        mimeType: 'text/csv',
      },
      { force: true },
    );
    cy.get('textarea[name="addresses"]').should('contain.value', 'Ada,ada@acme.io');
    cy.contains('2 valid unique address(es), 0 invalid, 0 repeated.').should('be.visible');
    cy.contains('button', 'Suppress addresses').click();
    cy.get('@done').should('have.been.calledOnce');
  });

  it('says why the addresses could not be added and stays open', () => {
    mount([failed]);
    cy.get('textarea[name="addresses"]').type('ada@acme.io');
    cy.contains('button', 'Suppress addresses').click();
    cy.contains('Too many addresses today').should('be.visible');
    cy.get('@done').should('not.have.been.called');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
