import { MockedProvider } from '@apollo/client/testing';
import { LocalizationProvider, AdapterDateFns } from '@exyconn/shell/components/ui';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { TaxRegimeForm } from './tax-regime.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <NotificationProvider>
            <TaxRegimeForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
          </NotificationProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('TaxRegimeForm', () => {
  it('refuses a regime with no key, year or name', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('A key is required').should('be.visible');
    cy.contains('Write the financial year as 2026-27').should('be.visible');
    cy.contains('A name is required').should('be.visible');
  });

  it('refuses a financial year that is not written as 2026-27', () => {
    mount();
    cy.get('input[name="regimeKey"]').type('NEW');
    cy.get('input[name="name"]').type('New regime');
    cy.get('input[name="financialYear"]').type('2026');
    cy.contains('button', 'Create').click();
    cy.contains('Write the financial year as 2026-27').should('be.visible');
  });

  it('refuses a lower-case key, so the bands can point at it', () => {
    mount();
    cy.get('input[name="regimeKey"]').type('new');
    cy.contains('button', 'Create').click();
    cy.contains('Use capitals, digits and underscores').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
