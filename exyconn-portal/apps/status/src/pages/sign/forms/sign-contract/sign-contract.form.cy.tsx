import { MockedProvider } from '@apollo/client/testing/react';
import type { MockLink } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { SignContractWithTokenDocument } from '@exyconn/shell/graphql/generated';
import { SignContractForm } from './sign-contract.form';
import type { ContractForSigning } from './sign-contract.types';

const TOKEN = 'signing-token-1';
const SHA = 'c0ffee'.repeat(10) + 'abcd';

const CONTRACT: ContractForSigning = {
  __typename: 'ContractToSign',
  title: 'Master services agreement',
  party: 'Acme Ltd',
  type: 'MSA',
  effectiveDate: '2026-07-01T00:00:00.000Z',
  expiryDate: null,
  documentUrl: 'https://files.exyconn.com/contracts/msa.pdf',
  signerName: 'Sam Khan',
  signedAt: null,
} as ContractForSigning;

const signed: MockLink.MockedResponse = {
  request: {
    query: SignContractWithTokenDocument,
    variables: { token: TOKEN, signedName: CONTRACT.signerName },
  },
  result: {
    data: {
      signContractWithToken: {
        __typename: 'ContractSignature',
        signedAt: '2026-07-02T09:30:00.000Z',
        documentSha256: SHA,
      },
    },
  },
};

const renamed: MockLink.MockedResponse = {
  request: {
    query: SignContractWithTokenDocument,
    variables: { token: TOKEN, signedName: 'Samira Khan' },
  },
  result: {
    data: {
      signContractWithToken: {
        __typename: 'ContractSignature',
        signedAt: '2026-07-02T09:30:00.000Z',
        documentSha256: SHA,
      },
    },
  },
};

const refused: MockLink.MockedResponse = {
  request: {
    query: SignContractWithTokenDocument,
    variables: { token: TOKEN, signedName: 'Expired Link' },
  },
  error: new Error('This signing link has expired'),
};

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[signed, renamed, refused]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <SignContractForm
            token={TOKEN}
            contract={CONTRACT}
            onSigned={cy.stub().as('signed')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

/** The switch is the act of agreeing, so most paths have to flip it. */
const agree = () => cy.get('input[name="agreed"]').check();

describe('SignContractForm', () => {
  it('prefills the name the contract was sent to, so the signature matches the record', () => {
    mount();
    cy.get('input[name="signedName"]').should('have.value', CONTRACT.signerName);
  });

  it('says what signing records, before anything is signed', () => {
    mount();
    cy.contains('Read the document above before signing').should('be.visible');
    cy.contains('a fingerprint of the document as it is now').should('be.visible');
  });

  it('will not sign on a typed name alone — a name in a box is not consent', () => {
    mount();
    cy.contains('button', 'Sign').click();
    cy.contains('Confirm that you agree to be bound by it').should('be.visible');
    cy.get('@signed').should('not.have.been.called');
  });

  it('will not sign for somebody who deleted the name', () => {
    mount();
    agree();
    cy.get('input[name="signedName"]').clear();
    cy.contains('button', 'Sign').click();
    cy.contains('Type your full name').should('be.visible');
    cy.get('@signed').should('not.have.been.called');
  });

  it('hands back the fingerprint of what was signed', () => {
    mount();
    agree();
    cy.contains('button', 'Sign').click();
    cy.get('@signed').should('have.been.calledWith', SHA);
  });

  it('signs under a corrected name, for somebody whose record spells it wrong', () => {
    mount();
    agree();
    cy.get('input[name="signedName"]').clear().type('Samira Khan');
    cy.contains('button', 'Sign').click();
    cy.get('@signed').should('have.been.calledWith', SHA);
  });

  it('reports a link that is no longer good rather than appearing to sign', () => {
    mount();
    agree();
    cy.get('input[name="signedName"]').clear().type('Expired Link');
    cy.contains('button', 'Sign').click();
    cy.contains('This signing link has expired').should('be.visible');
    cy.get('@signed').should('not.have.been.called');
  });

  it('leaves without signing', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
    cy.get('@signed').should('not.have.been.called');
  });
});
