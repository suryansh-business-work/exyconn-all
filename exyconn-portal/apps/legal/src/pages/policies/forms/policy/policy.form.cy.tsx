import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { PolicyForm } from './policy.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <PolicyForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('PolicyForm', () => {
  it('requires a title, a slug, a body and an effective date', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Title is required').should('be.visible');
    cy.contains('Slug is required').should('be.visible');
    cy.contains('The policy cannot be empty').should('be.visible');
    cy.contains('Effective date is required').should('be.visible');
  });

  it('rejects a slug with capitals or spaces in it', () => {
    mount();
    cy.get('input[name="title"]').type('Acceptable Use');
    cy.get('input[name="slug"]').type('Acceptable Use');
    cy.contains('button', 'Create').click();
    cy.contains('Lower-case letters, numbers and hyphens only').should('be.visible');
  });

  it('accepts a hyphenated lower-case slug', () => {
    mount();
    cy.get('input[name="title"]').type('Acceptable Use');
    cy.get('input[name="slug"]').type('acceptable-use-2026');
    cy.contains('button', 'Create').click();
    cy.contains('Lower-case letters, numbers and hyphens only').should('not.exist');
  });

  it('invokes onCancel when Cancel is clicked', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
