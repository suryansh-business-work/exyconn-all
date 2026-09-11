import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { BudgetForm } from './budget.form';

const CENTRES = [{ value: 'c1', label: 'ENG — Engineering' }];

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <BudgetForm
            initial={null}
            costCentres={CENTRES}
            onDone={cy.stub()}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('BudgetForm', () => {
  it('requires a cost centre and a month', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Pick a cost centre').should('be.visible');
    cy.contains('Use YYYY-MM, e.g. 2026-04').should('be.visible');
  });

  it('rejects a month that could never be matched to actuals', () => {
    mount();
    cy.get('input[name="month"]').type('April 2026');
    cy.contains('button', 'Create').click();
    cy.contains('Use YYYY-MM, e.g. 2026-04').should('be.visible');
  });

  it('invokes onCancel when Cancel is clicked', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
