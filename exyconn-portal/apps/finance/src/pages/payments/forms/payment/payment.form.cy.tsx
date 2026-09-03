import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { PaymentForm } from './payment.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <PaymentForm onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('PaymentForm', () => {
  it('requires an invoice to record a payment against', () => {
    mount();
    cy.contains('button', 'Record').click();
    cy.contains('Choose an invoice').should('be.visible');
  });

  it('rejects a payment of nothing', () => {
    mount();
    cy.get('input[name="amount"]').clear().type('0');
    cy.contains('button', 'Record').click();
    cy.contains('A payment of zero records nothing').should('be.visible');
  });

  it('asks for an invoice before it can say what a payment would leave owing', () => {
    mount();
    cy.contains('Choose an invoice to see what it will leave owing').should('be.visible');
  });

  it('invokes onCancel when Cancel is clicked', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
