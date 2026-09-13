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
    // Money is the company's own (Admin › Organizations), so a form mounted with no company
    // settings has no currency to start in and says so rather than inventing one.
    cy.contains('Currency is required').should('be.visible');
  });

  it('takes a currency from the ISO 4217 list', () => {
    mount();
    cy.get('input[name="currency"]').type('Euro');
    cy.contains('li', 'Euro (EUR)').click();
    cy.contains('button', 'Create').click();
    cy.contains('Currency is required').should('not.exist');
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
