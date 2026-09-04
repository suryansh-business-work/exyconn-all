import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@/components/ui/styles';
import { UserForm } from './user.form';
import { NotificationProvider } from '@/components/feedback/NotificationProvider';
import { theme } from '@/config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <UserForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('UserForm', () => {
  it('requires name and email on create', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Name is required').should('be.visible');
    cy.contains('Email is required').should('be.visible');
  });

  it('hides the password field on create (temp password is emailed)', () => {
    mount();
    cy.get('input[name="password"]').should('not.exist');
    cy.contains('A temporary password will be emailed to the user.').should('be.visible');
  });

  it('defaults the working day to 8 hours and explains what it drives', () => {
    mount();
    cy.get('input[name="workHoursPerDay"]').should('have.value', '8');
    cy.contains('the desktop tracker shows progress against this').should('be.visible');
  });

  it('asks for a description only when the arrangement is "Other"', () => {
    mount();
    cy.get('input[name="workingTimeNote"]').should('not.exist');
    cy.get('[name="workingTime"]').parent().click();
    cy.contains('li', 'Other').click();
    cy.get('input[name="workingTimeNote"]').should('exist');
    cy.contains('button', 'Create').click();
    cy.contains('Describe the working-time arrangement').should('be.visible');
  });

  it('rejects a working day outside 1-24 hours', () => {
    mount();
    cy.get('input[name="workHoursPerDay"]').clear().type('30');
    cy.contains('button', 'Create').click();
    cy.contains('Enter between 1 and 24 hours').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
