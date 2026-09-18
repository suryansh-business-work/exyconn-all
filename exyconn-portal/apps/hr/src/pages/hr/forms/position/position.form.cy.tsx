import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { PositionForm } from './position.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <PositionForm
            initial={null}
            department="Engineering"
            onDone={cy.stub()}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('PositionForm', () => {
  it('requires a name', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Name is required').should('be.visible');
  });

  it('refuses a maximum salary below the minimum', () => {
    mount();
    cy.get('input[name="name"]').type('Engineer');
    cy.get('input[name="minSalary"]').clear().type('5000');
    cy.get('input[name="maxSalary"]').clear().type('1000');
    cy.contains('button', 'Create').click();
    cy.contains('Maximum salary cannot be less than the minimum').should('be.visible');
  });

  it('refuses a fractional headcount', () => {
    mount();
    cy.get('input[name="headcount"]').clear().type('1.5');
    cy.contains('button', 'Create').click();
    cy.contains('Headcount must be a whole number').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
