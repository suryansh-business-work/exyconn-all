import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { RequestSignatureForm } from './request-signature.form';

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

const mount = (over: Record<string, unknown> = {}) =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <RequestSignatureForm
            contract={contract(over)}
            onDone={cy.stub()}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('RequestSignatureForm', () => {
  it('asks who is signing, and for a real email', () => {
    mount();
    cy.get('input[name="signerName"]').should('have.value', 'Acme Inc');
    cy.get('input[name="signerName"]').clear();
    cy.contains('button', 'Send for signature').click();
    cy.contains('Who are you asking?').should('be.visible');
    cy.contains('Enter a valid email').should('be.visible');
  });

  it('says when there is no document to sign yet', () => {
    mount({ documentUrl: '' });
    cy.contains('Attach the document to this contract first').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
