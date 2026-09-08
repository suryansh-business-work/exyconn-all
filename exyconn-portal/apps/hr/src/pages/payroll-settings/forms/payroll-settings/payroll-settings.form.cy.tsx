import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { TdsMode } from '@exyconn/shell/graphql/generated';
import { PayrollSettingsForm } from './payroll-settings.form';
import type { PayrollSettingsRow } from './payroll-settings.types';

const INITIAL: PayrollSettingsRow = {
  __typename: 'PayrollSettings',
  pfEnabled: true,
  pfEmployeePercent: 12,
  pfWageCeiling: 15000,
  esiEnabled: true,
  esiEmployeePercent: 0.75,
  esiWageLimit: 21000,
  professionalTaxMonthly: 200,
  tdsMode: TdsMode.None,
  tdsFlatPercent: 0,
};

const mount = (initial: PayrollSettingsRow = INITIAL) =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <PayrollSettingsForm
            initial={initial}
            onDone={cy.stub()}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('PayrollSettingsForm', () => {
  it('shows the stored policy', () => {
    mount();
    cy.get('input[name="pfEmployeePercent"]').should('have.value', '12');
    cy.get('input[name="esiWageLimit"]').should('have.value', '21000');
  });

  it('refuses a rate that is not a percentage', () => {
    mount();
    cy.get('input[name="pfEmployeePercent"]').clear().type('150');
    cy.contains('button', 'Save deductions').click();
    cy.contains('The PF rate cannot exceed 100%').should('be.visible');
  });

  it('refuses a negative wage ceiling', () => {
    mount();
    cy.get('input[name="pfWageCeiling"]').clear().type('-1');
    cy.contains('button', 'Save deductions').click();
    cy.contains('The PF wage ceiling cannot be negative').should('be.visible');
  });

  it('only asks for a company TDS rate when a flat percentage is withheld', () => {
    mount();
    cy.get('input[name="tdsFlatPercent"]').should('not.exist');
    mount({ ...INITIAL, tdsMode: TdsMode.FlatPercent });
    cy.get('input[name="tdsFlatPercent"]').should('exist');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
