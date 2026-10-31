import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { VendorInvoiceForm } from './vendor-invoice.form';

const ORDER = { id: 'po-1', number: 'PO-0001', total: 1250, currency: 'USD' };

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <VendorInvoiceForm
            order={ORDER}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('VendorInvoiceForm', () => {
  it('requires the invoice number, both dates and the document', () => {
    mount();
    cy.contains('button', 'Send invoice').click();
    cy.contains('Invoice number is required').should('be.visible');
    cy.contains('Invoice date is required').should('be.visible');
    cy.contains('Due date is required').should('be.visible');
    cy.contains('Attach the invoice document — one PDF or image').should('be.visible');
    cy.get('@done').should('not.have.been.called');
  });

  it("starts at the order's total and refuses an amount of zero", () => {
    mount();
    cy.get('input[name="amount"]').should('have.value', '1250');
    cy.get('input[name="amount"]').clear().type('0').blur();
    cy.contains('The amount must be more than zero').should('be.visible');
  });

  it('refuses a due date before the invoice date', () => {
    mount();
    cy.get('input[name="invoiceDate"]').typeDate('10022026');
    cy.get('input[name="dueDate"]').typeDate('09302026');
    cy.contains('button', 'Send invoice').click();
    cy.contains('The due date cannot be before the invoice date').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
