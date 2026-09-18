import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { PurchaseRequestForm } from './purchase-request.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <PurchaseRequestForm
            initial={null}
            onDone={cy.stub()}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('PurchaseRequestForm', () => {
  it('requires what is bought and why', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Say what is being bought').should('be.visible');
    cy.contains('Say why it is needed').should('be.visible');
  });

  it('adds and removes quotes', () => {
    mount();
    cy.contains('button', 'Add quote').click();
    cy.get('input[name="quotes.0.vendor"]').should('exist');
    cy.get('button[aria-label="Remove quote"]').click();
    cy.get('input[name="quotes.0.vendor"]').should('not.exist');
  });

  it('refuses a quote with no vendor', () => {
    mount();
    cy.contains('button', 'Add quote').click();
    cy.contains('button', 'Create').click();
    cy.contains('Vendor is required').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
