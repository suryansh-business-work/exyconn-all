import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { ContactForm } from './contact.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { noCustomPropertiesMock } from '../../../../records/custom-fields/noCustomProperties.mock';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[noCustomPropertiesMock]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <ContactForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('ContactForm', () => {
  it('requires a name, an email and an owner', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Name is required').should('be.visible');
    cy.contains('Add at least one email address').should('be.visible');
    cy.contains('Owner is required').should('be.visible');
  });

  it('rejects a malformed email', () => {
    mount();
    cy.get('input[name="name"]').type('Asha Rao');
    cy.get('input[name="owner"]').type('Priya');
    cy.contains('button', 'Add email').click();
    cy.get('input[name="emails.0.address"]').type('asha.rao');
    cy.contains('button', 'Create').click();
    cy.contains('Enter a valid email').should('be.visible');
  });

  it('clears the email error once an address is added', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Add at least one email address').should('be.visible');
    cy.contains('button', 'Add email').click();
    cy.get('input[name="emails.0.address"]').type('asha.rao@example.com');
    cy.contains('button', 'Create').click();
    cy.contains('Add at least one email address').should('not.exist');
  });

  it('invokes onCancel when Cancel is clicked', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
