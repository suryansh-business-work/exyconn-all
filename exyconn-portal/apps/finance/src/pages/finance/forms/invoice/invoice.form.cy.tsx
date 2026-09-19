import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { InvoiceStatus } from '@exyconn/shell/graphql/generated';
import { InvoiceForm } from './invoice.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import type { InvoiceRow } from './invoice.types';

/** An invoice the server has already declared late, as the grid hands it to the form. */
const OVERDUE_INVOICE: InvoiceRow = {
  id: 'invoice-1',
  number: 'INV-001',
  clientId: 'client-1',
  clientName: 'Nimbus Ltd',
  lines: [],
  amount: 1000,
  currency: 'INR',
  status: InvoiceStatus.Overdue,
  issuedDate: '2026-08-01',
  dueDate: '2026-08-15',
  sentAt: '2026-08-01',
  amountPaid: 0,
  balanceDue: 1000,
  dealId: '',
  placeOfSupplyStateCode: '27',
  supplierStateCode: '27',
  subtotal: 1000,
  taxTotal: 0,
  cgst: 0,
  sgst: 0,
  igst: 0,
};

const mountWith = (initial: InvoiceRow | null) =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <InvoiceForm initial={initial} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

const mount = () => mountWith(null);

/** Opens the status dropdown. The select is found by the field name it is bound to. */
const openStatus = () => cy.get('input[name="status"]').parent().find('[role="combobox"]').click();

describe('InvoiceForm', () => {
  it('requires the invoice number and client', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Invoice number is required').should('be.visible');
    cy.contains('Client is required').should('be.visible');
  });

  it('offers a typed amount until a line is added, then shows the live total instead', () => {
    mount();
    cy.get('input[name="amount"]').should('exist');
    cy.contains('button', 'Add line').click();
    cy.get('input[name="amount"]').should('not.exist');
    cy.get('input[name="lines.0.rate"]').clear().type('1000');
    cy.get('input[name="lines.0.taxPercent"]').clear().type('18');
    cy.contains('Total').should('contain', '1,180');
  });

  it('requires a description on every line', () => {
    mount();
    cy.contains('button', 'Add line').click();
    cy.contains('button', 'Create').click();
    cy.contains('Describe the line').should('be.visible');
  });

  it('offers only the statuses a person decides, never overdue or paid', () => {
    mount();
    openStatus();
    cy.get('[role="option"]').should('have.length', 2);
    cy.contains('[role="option"]', 'Draft').should('exist');
    cy.contains('[role="option"]', 'Sent').should('exist');
    cy.contains('[role="option"]', 'Overdue').should('not.exist');
    cy.contains('[role="option"]', 'Paid').should('not.exist');
  });

  it('keeps the status the server gave an invoice, so editing one cannot reset it', () => {
    mountWith(OVERDUE_INVOICE);
    openStatus();
    cy.get('[role="option"]').should('have.length', 3);
    cy.contains('[role="option"]', 'Overdue').should('exist');
  });

  it('invokes onCancel when Cancel is clicked', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
