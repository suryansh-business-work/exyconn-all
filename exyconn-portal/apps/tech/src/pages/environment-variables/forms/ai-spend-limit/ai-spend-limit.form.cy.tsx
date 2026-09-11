import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { AiSpendLimitForm } from './ai-spend-limit.form';

const initial = { monthlyUsdCap: 50, perUserDailyUsdCap: 5, enabled: true };

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <AiSpendLimitForm
            initial={initial}
            onDone={cy.stub()}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('AiSpendLimitForm', () => {
  it('opens on the saved caps', () => {
    mount();
    cy.get('input[name="monthlyUsdCap"]').should('have.value', '50');
    cy.get('input[name="perUserDailyUsdCap"]').should('have.value', '5');
  });

  it('rejects a negative cap', () => {
    mount();
    cy.get('input[name="monthlyUsdCap"]').clear().type('-5');
    cy.contains('button', 'Save budget').click();
    cy.contains('The monthly cap cannot be negative').should('be.visible');
  });

  it('rejects a cap that is not a number', () => {
    mount();
    cy.get('input[name="perUserDailyUsdCap"]').clear().type('lots');
    cy.contains('button', 'Save budget').click();
    cy.contains('The per-person daily cap must be a number').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
