import { MockedProvider } from '@apollo/client/testing/react';
import type { MockedResponse } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { SignContractDocument } from '@exyconn/shell/graphql/generated';
import { SignContractForm } from './sign-contract.form';

const contract = (over: Record<string, unknown> = {}) =>
  ({
    id: '1',
    title: 'Service Agreement',
    party: 'Acme Inc',
    type: 'MSA',
    effectiveDate: '',
    expiryDate: '',
    status: 'DRAFT',
    documentUrl: 'https://files.exyconn.com/msa.pdf',
    sentAt: null,
    signedBy: null,
    signedAt: null,
    ...over,
  }) as never;

const signed: MockedResponse = {
  request: { query: SignContractDocument, variables: { id: '1' } },
  result: {
    data: {
      signContract: {
        __typename: 'Contract',
        id: '1',
        signedBy: 'admin@exyconn.com',
        signedAt: '2026-09-20T00:00:00.000Z',
        status: 'SIGNED',
      },
    },
  },
};

const mount = (over: Record<string, unknown> = {}, mocks: MockedResponse[] = []) =>
  cy.mount(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <SignContractForm
            contract={contract(over)}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('SignContractForm', () => {
  it('signs as the signed-in account, saying what will be hashed', () => {
    mount({}, [signed]);
    cy.contains('Signing “Service Agreement” with Acme Inc, as yourself.').should('be.visible');
    cy.contains('The document will be read and hashed now').should('be.visible');
    cy.contains('button', 'Sign').click();
    cy.get('@done').should('have.been.called');
  });

  it('cannot sign a contract with no document attached', () => {
    mount({ documentUrl: '' });
    cy.contains('Attach the document to this contract first').should('be.visible');
    cy.contains('button', 'Sign').should('be.disabled');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
