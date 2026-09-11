import { MockedProvider } from '@apollo/client/testing/react';
import { LocalizationProvider, AdapterDateFns } from '@exyconn/shell/components/ui';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { TaxSlabForm } from './tax-slab.form';

const REGIMES = [{ value: 'NEW', label: 'New regime' }];

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <NotificationProvider>
            <TaxSlabForm
              initial={null}
              regimeOptions={REGIMES}
              defaultRegimeKey="NEW"
              defaultFinancialYear="2026-27"
              onDone={cy.stub()}
              onCancel={cy.stub().as('cancel')}
            />
          </NotificationProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('TaxSlabForm', () => {
  it('refuses an upper bound at or below the lower one', () => {
    mount();
    cy.get('input[name="fromAmount"]').clear().type('500000');
    cy.get('input[name="toAmount"]').clear().type('300000');
    cy.contains('button', 'Create').click();
    cy.contains('The upper bound has to be above the lower one').should('be.visible');
  });

  it('accepts an empty upper bound as the open-ended top band', () => {
    mount();
    cy.get('input[name="fromAmount"]').clear().type('1500000');
    cy.get('input[name="toAmount"]').clear();
    cy.contains('button', 'Create').click();
    cy.contains('The upper bound has to be above the lower one').should('not.exist');
  });

  it('refuses a rate above 100%', () => {
    mount();
    cy.get('input[name="ratePercent"]').clear().type('120');
    cy.contains('button', 'Create').click();
    cy.contains('A rate cannot exceed 100%').should('be.visible');
  });

  it('refuses a financial year that is not written as 2026-27', () => {
    mount();
    cy.get('input[name="financialYear"]').clear().type('2026');
    cy.contains('button', 'Create').click();
    cy.contains('Write the financial year as 2026-27').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
