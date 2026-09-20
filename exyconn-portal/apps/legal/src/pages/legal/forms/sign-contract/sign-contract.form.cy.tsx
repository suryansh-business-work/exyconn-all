import { MockedProvider } from '@apollo/client/testing/react';
import { type MockedResponse } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { SignContractDocument } from '@exyconn/shell/graphql/generated';
import { SignContractForm } from './sign-contract.form';

const contract = (documentUrl: string) =>
  ({
    id: '1',
    title: 'Service Agreement',
    party: 'Acme Inc',
    type: 'MSA',
    effectiveDate: '',
    expiryDate: '',
    status: 'DRAFT',
    documentUrl,
    sentAt: null,
    signedBy: null,
    signedAt: null,
  }) as never;

const signed: MockedResponse = {
  request: { query: SignContractDocument, variables: { id: '1' } },
  result: {
    data: {
      signContract: {
        id: '1',
        signedBy: 'dev@exyconn.com',
        signedAt: '2026-09-20T09:00:00Z',
        status: 'ACTIVE',
      },
    },
  },
};

const mount = (documentUrl = 'https://cdn.example.com/msa.pdf', mocks: MockedResponse[] = []) =>
  cy.mount(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <SignContractForm
            contract={contract(documentUrl)}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('signing our own side of a contract', () => {
  it('asks for nothing: the signer is the account, not a typed name', () => {
    mount();
    cy.get('input').should('not.exist');
    cy.contains('as yourself').should('be.visible');
  });

  it('says the document will be hashed, so the signature is of this version', () => {
    mount();
    cy.contains('read and hashed now').should('be.visible');
  });

  it('will not sign a contract with nothing attached', () => {
    mount('');
    cy.contains('Attach the document').should('be.visible');
    cy.contains('button', 'Sign').should('be.disabled');
  });

  it('signs, and tells whoever opened it', () => {
    mount('https://cdn.example.com/msa.pdf', [signed]);
    cy.contains('button', 'Sign').click();
    cy.get('@done').should('have.been.called');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
