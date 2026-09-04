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

  it('asks for the monthly components on a FIXED salary', () => {
    mount();
    cy.get('input[name="basic"]').should('exist');
    cy.get('input[name="rate"]').should('not.exist');
  });

  it('swaps to a single amount when the pay type is hourly', () => {
    mount();
    cy.get('[name="payType"]').parent().click();
    cy.contains('li', 'Hourly').click();
    cy.contains('label', 'Rate per hour').should('be.visible');
    // Asking for a basic salary as well would invite an hourly employee who also draws one.
    cy.get('input[name="basic"]').should('not.exist');
  });

  it('requires the amount that actually pays the person', () => {
    mount();
    cy.get('[name="payType"]').parent().click();
    cy.contains('li', 'Stipend').click();
    cy.contains('button', 'Create').click();
    cy.contains('Enter the amount this employee is paid').should('be.visible');
  });

  it('asks what a billing rate is for, whatever the pay type', () => {
    mount();
    cy.contains("What the tracker bills an hour of this person's time at").should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
