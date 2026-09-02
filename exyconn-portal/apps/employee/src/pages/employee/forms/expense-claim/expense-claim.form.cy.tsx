import { MockedProvider } from '@apollo/client/testing';
import { LocalizationProvider, AdapterDateFns } from '@exyconn/shell/components/ui';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { ExpenseClaimForm } from './expense-claim.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <NotificationProvider>
            <ExpenseClaimForm onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
          </NotificationProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('ExpenseClaimForm', () => {
  it('requires a category, description and date', () => {
    mount();
    cy.contains('button', 'Submit claim').click();
    cy.contains('Category is required').should('be.visible');
    cy.contains('Description is required').should('be.visible');
    cy.contains('Date is required').should('be.visible');
  });

  it('rejects a zero amount', () => {
    mount();
    cy.get('input[name="amount"]').clear().type('0');
    cy.contains('button', 'Submit claim').click();
    cy.contains('Must be more than 0').should('be.visible');
  });

  it('rejects a receipt link that is not a URL', () => {
    mount();
    cy.get('input[name="receiptUrl"]').type('not-a-link');
    cy.contains('button', 'Submit claim').click();
    cy.contains('Must be a valid link').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
