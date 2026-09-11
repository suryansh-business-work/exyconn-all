import { MockedProvider } from '@apollo/client/testing/react';
import { LocalizationProvider, AdapterDateFns } from '@exyconn/shell/components/ui';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { SalaryStructureForm } from './salary-structure.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <NotificationProvider>
            <SalaryStructureForm
              initial={null}
              onDone={cy.stub()}
              onCancel={cy.stub().as('cancel')}
            />
          </NotificationProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('SalaryStructureForm', () => {
  it('validates the required fields', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Employee is required').should('be.visible');
    // A new structure starts in the default currency, so the currency error only
    // appears once somebody empties the field.
    cy.contains('Currency is required').should('not.exist');
  });

  it('refuses a structure with no currency', () => {
    mount();
    cy.get('input[name="currency"]').clear();
    cy.contains('button', 'Create').click();
    cy.contains('Currency is required').should('be.visible');
  });

  it('requires the basic salary that actually pays the person', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Enter the basic salary').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
