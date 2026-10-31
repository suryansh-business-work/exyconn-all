import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { theme } from '@exyconn/shell/config/theme';
import {
  CheckoutProvider,
  PlanInterval,
  StartBillingCheckoutDocument,
  type BillingPlanFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import { BillingCheckoutForm } from './billing-checkout.form';

const PLAN: BillingPlanFieldsFragment = {
  __typename: 'BillingPlan',
  id: 'plan-growth',
  key: 'growth',
  name: 'Growth',
  description: '',
  prices: [
    { __typename: 'PlanPrice', currency: 'USD', amount: 49 },
    { __typename: 'PlanPrice', currency: 'INR', amount: 3999 },
  ],
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

const refused = {
  request: {
    query: StartBillingCheckoutDocument,
    variables: { input: { planId: 'plan-growth', currency: 'INR', provider: 'STRIPE' } },
  },
  error: new Error('Stripe is not configured.'),
};

const mount = (providers: CheckoutProvider[], mocks: unknown[] = []) =>
  cy.mount(
    <MockedProvider mocks={mocks as never}>
      <ThemeProvider theme={theme}>
        <BillingCheckoutForm
          plan={PLAN}
          providers={providers}
          preferredCurrency="INR"
          onCancel={cy.stub().as('cancel')}
        />
      </ThemeProvider>
    </MockedProvider>,
  );

describe('BillingCheckoutForm', () => {
  it('says online payment is not set up when no gateway is configured', () => {
    mount([]);
    cy.contains('Online payment is not set up yet').should('be.visible');
    cy.contains('button', 'Continue to payment').should('not.exist');
  });

  it('starts in the company currency and shows why the checkout was refused', () => {
    mount([CheckoutProvider.Stripe, CheckoutProvider.Razorpay], [refused]);
    cy.get('input[name="currency"]').should('have.value', 'INR');
    cy.get('input[name="provider"]').should('have.value', 'STRIPE');
    cy.contains('button', 'Continue to payment').click();
    cy.contains('Stripe is not configured.').should('be.visible');
  });

  it('calls onCancel', () => {
    mount([CheckoutProvider.Stripe]);
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
