import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { SupplierForm } from './supplier.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <SupplierForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('SupplierForm', () => {
  it('requires a name and a code', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Name is required').should('be.visible');
    cy.contains('Code is required').should('be.visible');
  });

  it('keeps the code short enough for a purchase order', () => {
    mount();
    cy.get('input[name="name"]').type('Acme Supplies');
    cy.get('input[name="code"]').type('ACME-SUPPLIES-LIMITED');
    cy.contains('button', 'Create').click();
    cy.contains('Keep the code short — it goes on purchase orders').should('be.visible');
  });

  it('rejects punctuation in the code', () => {
    mount();
    cy.get('input[name="name"]').type('Acme Supplies');
    cy.get('input[name="code"]').type('ACME 01');
    cy.contains('button', 'Create').click();
    cy.contains('Use letters, digits and dashes only').should('be.visible');
  });

  it('rejects a malformed email but allows none at all', () => {
    mount();
    cy.get('input[name="name"]').type('Acme Supplies');
    cy.get('input[name="code"]').type('ACME-01');
    cy.get('input[name="email"]').type('not-an-email');
    cy.contains('button', 'Create').click();
    cy.contains('Enter a valid email').should('be.visible');

    cy.get('input[name="email"]').clear();
    cy.contains('Enter a valid email').should('not.exist');
  });

  it('invokes onCancel when Cancel is clicked', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
