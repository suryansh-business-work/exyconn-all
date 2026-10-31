import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { PlanForm } from './plan.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <PlanForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('PlanForm', () => {
  it('needs a name, a key and the modules it includes', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('A name is required').should('be.visible');
    cy.contains('A key is required').should('be.visible');
    cy.contains('Pick the modules it includes, or include every module').should('be.visible');
  });

  it('refuses a key that is not a handle and a trial over a year', () => {
    mount();
    cy.get('input[name="key"]').type('My Plan');
    cy.get('input[name="trialDays"]').clear().type('400');
    cy.contains('button', 'Create').click();
    cy.contains('Lower-case letters, digits and dashes only').should('be.visible');
    cy.contains('Trial days is at most 365').should('be.visible');
  });

  it('hides the module picker when the plan includes every module', () => {
    mount();
    cy.contains('label', 'Include every module').click();
    cy.get('input[name="modules"]').should('not.exist');
  });

  it('adds and removes a price', () => {
    mount();
    cy.contains('button', 'Add price').click();
    cy.get('input[name="prices.0.amount"]').should('exist');
    cy.get('button[aria-label="Remove price 1"]').click();
    cy.get('input[name="prices.0.amount"]').should('not.exist');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
