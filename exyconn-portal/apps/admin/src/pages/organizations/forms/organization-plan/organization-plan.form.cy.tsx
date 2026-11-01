import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import {
  BillingPlansDocument,
  OrganizationSubscriptionDocument,
} from '@exyconn/shell/graphql/generated';
import { OrganizationPlanForm } from './organization-plan.form';

const mocks = [
  { request: { query: BillingPlansDocument }, result: { data: { billingPlans: [] } } },
  {
    request: { query: OrganizationSubscriptionDocument, variables: { organizationId: 'org-1' } },
    result: { data: { organizationSubscription: null } },
  },
];

const mount = () =>
  cy.mount(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <OrganizationPlanForm
            organizationId="org-1"
            organizationName="Acme"
            onDone={cy.stub()}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('OrganizationPlanForm', () => {
  it('needs a plan for a company on none, defaulting the status to Active', () => {
    mount();
    cy.get('input[name="status"]').should('have.value', 'ACTIVE');
    cy.contains('button', 'Create').click();
    cy.contains('Pick a plan').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
