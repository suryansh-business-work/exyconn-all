import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { BugForm } from './bug.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <BugForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('BugForm', () => {
  it('validates required fields', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Title is required').should('be.visible');
    cy.contains('Project is required').should('be.visible');
    cy.contains('Description is required').should('be.visible');
    cy.contains('Assignee is required').should('not.exist');
  });

  it('offers the project and assignee as pickers, not free text', () => {
    mount();
    cy.get('input[role="combobox"]').should('have.length', 2);
    cy.contains('label', 'Project').should('be.visible');
    cy.contains('label', 'Assignee').should('be.visible');
  });

  it('rejects a link that is not a full https address', () => {
    mount();
    cy.get('input[name="publicLink"]').type('example.com').blur();
    cy.contains('Enter a full link starting with https://').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
