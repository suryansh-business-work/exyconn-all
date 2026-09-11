import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { EmailTemplateForm } from './email-template.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <EmailTemplateForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('EmailTemplateForm', () => {
  it('requires a key, a name, a subject and a body', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Key is required').should('be.visible');
    cy.contains('Name is required').should('be.visible');
    cy.contains('Subject is required').should('be.visible');
    cy.contains('The template cannot be empty').should('be.visible');
  });

  it('keeps the key to a stable lower-case identifier', () => {
    mount();
    cy.get('input[name="key"]').type('Welcome Email');
    cy.contains('button', 'Create').click();
    cy.contains('Lower-case letters, numbers and hyphens only').should('be.visible');
  });

  it('accepts a hyphenated lower-case key', () => {
    mount();
    cy.get('input[name="key"]').type('welcome-email-v2');
    cy.contains('button', 'Create').click();
    cy.contains('Lower-case letters, numbers and hyphens only').should('not.exist');
  });

  it('invokes onCancel when Cancel is clicked', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
