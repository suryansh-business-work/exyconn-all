import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { ContactForm } from './contact.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
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
    cy.contains('Email is required').should('be.visible');
    cy.contains('Owner is required').should('be.visible');
  });

  it('rejects a malformed email', () => {
    mount();
    cy.get('input[name="name"]').type('Asha Rao');
    cy.get('input[name="owner"]').type('Priya');
    cy.get('input[name="email"]').type('asha.rao');
    cy.contains('button', 'Create').click();
    cy.contains('Enter a valid email').should('be.visible');
  });

  it('clears the email error once a valid address is typed', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Email is required').should('be.visible');
    cy.get('input[name="email"]').type('asha.rao@example.com');
    cy.contains('Email is required').should('not.exist');
  });

  it('invokes onCancel when Cancel is clicked', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
