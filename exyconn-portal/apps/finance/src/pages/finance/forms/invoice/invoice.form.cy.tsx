import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { InvoiceForm } from './invoice.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <InvoiceForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

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

  it('invokes onCancel when Cancel is clicked', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
