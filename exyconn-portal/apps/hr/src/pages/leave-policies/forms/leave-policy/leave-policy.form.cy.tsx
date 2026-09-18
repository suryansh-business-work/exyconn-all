import { MockedProvider } from '@apollo/client/testing/react';
import { LocalizationProvider, AdapterDateFns } from '@exyconn/shell/components/ui';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { LeavePolicyForm } from './leave-policy.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <NotificationProvider>
            <LeavePolicyForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
          </NotificationProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('LeavePolicyForm', () => {
  it('validates the required fields', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Name is required').should('be.visible');
    cy.contains('Code is required').should('be.visible');
  });

  it('asks for the country on an override row', () => {
    mount();
    cy.contains('button', 'Add country override').click();
    cy.contains('button', 'Create').click();
    cy.contains('Choose a country').should('be.visible');
  });

  it('flags a country overridden twice', () => {
    mount();
    cy.contains('button', 'Add country override').click();
    cy.contains('button', 'Add country override').click();
    cy.get('input[name="overrides.0.country"]').type('India');
    cy.contains('[role="option"]', /^India$/).click();
    cy.get('input[name="overrides.1.country"]').type('India');
    cy.contains('[role="option"]', /^India$/).click();
    cy.contains('button', 'Create').click();
    cy.contains('This country already has an override').should('be.visible');
  });

  it('removes an override row', () => {
    mount();
    cy.contains('button', 'Add country override').click();
    cy.get('[aria-label="Remove override 1"]').click();
    cy.get('input[name="overrides.0.country"]').should('not.exist');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
