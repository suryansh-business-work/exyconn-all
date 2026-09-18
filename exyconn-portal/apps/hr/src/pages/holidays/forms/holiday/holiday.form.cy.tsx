import { MockedProvider } from '@apollo/client/testing/react';
import { LocalizationProvider, AdapterDateFns } from '@exyconn/shell/components/ui';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { HolidayForm } from './holiday.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <NotificationProvider>
            <HolidayForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
          </NotificationProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('HolidayForm', () => {
  it('validates the required fields', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Name is required').should('be.visible');
    cy.contains('Date is required').should('be.visible');
  });

  it('offers opt-outs only on a company-wide holiday', () => {
    mount();
    cy.contains('Countries whose employees work on this day.').should('exist');
    cy.get('input[name="country"]').clear();
    cy.get('input[name="country"]').type('India');
    cy.contains('[role="option"]', /^India$/).click();
    cy.contains('Countries whose employees work on this day.').should('not.exist');
  });

  it('narrows a country holiday to cities', () => {
    mount();
    cy.contains('Leave empty for the whole country.').should('not.exist');
    cy.get('input[name="country"]').clear();
    cy.get('input[name="country"]').type('India');
    cy.contains('[role="option"]', /^India$/).click();
    cy.contains('Leave empty for the whole country.').should('be.visible');
    cy.contains('label', 'Cities').parent().find('input').type('Pune{enter}');
    cy.contains('.MuiChip-root', 'Pune').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
