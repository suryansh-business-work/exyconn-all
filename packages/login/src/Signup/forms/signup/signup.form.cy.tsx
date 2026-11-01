import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { theme } from '@exyconn/shell/config/theme';
import { PlanInterval, type BillingPlanFieldsFragment } from '@exyconn/shell/graphql/generated';
import { color } from '@exyconn/ui';
import { SignupForm } from './signup.form';

const PLAN: BillingPlanFieldsFragment = {
  __typename: 'BillingPlan',
  id: 'plan-growth',
  key: 'growth',
  name: 'Growth',
  description: '',
  prices: [{ __typename: 'PlanPrice', currency: 'USD', amount: 49 }],
  interval: PlanInterval.Month,
  trialDays: 14,
  seatLimit: 10,
  allModules: true,
  modules: [],
  aiMonthlyUsdCap: 0,
  isPublic: true,
  isActive: true,
  isSystem: false,
  sortOrder: 0,
};

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <SignupForm
          plans={[PLAN]}
          accentColor={color.blue[600]}
          onCodeSent={cy.stub().as('sent')}
        />
      </ThemeProvider>
    </MockedProvider>,
  );

describe('SignupForm', () => {
  it('asks for every required field', () => {
    mount();
    cy.contains('button', 'Email me a code').click();
    cy.contains('Your name is required').should('be.visible');
    cy.contains('Email is required').should('be.visible');
    cy.contains('Company name is required').should('be.visible');
    cy.contains('Currency is required').should('be.visible');
    cy.get('@sent').should('not.have.been.called');
  });

  it('refuses an address that is not an email', () => {
    mount();
    cy.get('input[name="email"]').type('ada@');
    cy.contains('button', 'Email me a code').click();
    cy.contains('Enter a valid email').should('be.visible');
  });

  it('names the plan with its free trial', () => {
    mount();
    cy.contains('Growth — 14-day free trial').should('be.visible');
  });
});
