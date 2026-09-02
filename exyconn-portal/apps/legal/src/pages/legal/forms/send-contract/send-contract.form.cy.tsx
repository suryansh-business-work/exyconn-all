import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { SendContractForm } from './send-contract.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

const contract = {
  id: '1',
  title: 'Service Agreement',
  party: 'Acme Inc',
  type: 'MSA',
  effectiveDate: '',
  expiryDate: '',
  status: 'DRAFT',
  sentAt: null,
  signedBy: null,
  signedAt: null,
} as never;

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <SendContractForm
            contract={contract}
            onDone={cy.stub()}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('SendContractForm', () => {
  it('validates the recipient email', () => {
    mount();
    cy.contains('button', 'Send').click();
    cy.contains('Enter a valid email').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
