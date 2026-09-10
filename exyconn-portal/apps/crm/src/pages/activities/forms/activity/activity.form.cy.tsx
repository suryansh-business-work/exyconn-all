import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { ActivityForm } from './activity.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <ActivityForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('ActivityForm', () => {
  it('requires a subject, an owner and something to be about', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Subject is required').should('be.visible');
    cy.contains('Owner is required').should('be.visible');
    cy.contains('Choose what this is about').should('be.visible');
  });

  it('does not crash when a due date is typed by hand', () => {
    mount();
    cy.typeDate('dueDate', '12012026');
    cy.get('input[name="subject"]').should('exist');
  });

  it('clears the subject error once a subject is typed', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Subject is required').should('be.visible');
    cy.get('input[name="subject"]').type('Follow up on the proposal');
    cy.contains('Subject is required').should('not.exist');
  });

  it('invokes onCancel when Cancel is clicked', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
