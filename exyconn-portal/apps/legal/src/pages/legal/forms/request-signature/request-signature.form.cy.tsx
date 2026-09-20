import { MockedProvider } from '@apollo/client/testing/react';
import { type MockedResponse } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { RequestContractSignatureDocument } from '@exyconn/shell/graphql/generated';
import { RequestSignatureForm } from './request-signature.form';

const contract = (documentUrl = 'https://cdn.example.com/msa.pdf') =>
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

const requested: MockedResponse = {
  request: {
    query: RequestContractSignatureDocument,
    variables: {
      contractId: '1',
      signerName: 'Acme Inc',
      signerEmail: 'legal@acme.com',
      message: null,
    },
  },
  result: {
    data: {
      requestContractSignature: { id: 'req-1', url: 'https://status.exyconn.com/sign/abc' },
    },
  },
};

const mount = (mocks: MockedResponse[] = [], documentUrl?: string) =>
  cy.mount(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <RequestSignatureForm
            contract={contract(documentUrl)}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('asking a counterparty to sign', () => {
  it('offers the counterparty as the signer, and asks where to send it', () => {
    mount();
    cy.get('input[name="signerName"]').should('have.value', 'Acme Inc');
    cy.get('input[name="signerEmail"]').should('have.value', '');
  });

  it('validates the address the link is sent to', () => {
    mount();
    cy.get('input[name="signerEmail"]').type('not-an-email');
    cy.contains('button', 'Send for signature').click();
    cy.contains('Enter a valid email').should('be.visible');
  });

  it('warns when there is nothing for them to read', () => {
    mount([], '');
    cy.contains('Attach the document').should('be.visible');
  });

  it('sends the request', () => {
    mount([requested]);
    cy.get('input[name="signerEmail"]').type('legal@acme.com');
    cy.contains('button', 'Send for signature').click();
    cy.get('@done').should('have.been.called');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
