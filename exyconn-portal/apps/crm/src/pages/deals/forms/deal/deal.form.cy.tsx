import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { DealForm } from './deal.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <DealForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('DealForm', () => {
  it('requires a title and an owner', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Title is required').should('be.visible');
    cy.contains('Owner is required').should('be.visible');
  });

  it('refuses a negative deal value', () => {
    mount();
    cy.get('input[name="title"]').type('Acme rollout');
    cy.get('input[name="owner"]').type('Priya');
    cy.get('input[name="value"]').clear().type('-1');
    cy.contains('button', 'Create').click();
    cy.contains('Value cannot be negative').should('be.visible');
  });

  it('keeps probability a percent', () => {
    mount();
    cy.get('input[name="title"]').type('Acme rollout');
    cy.get('input[name="owner"]').type('Priya');
    cy.get('input[name="probability"]').clear().type('120');
    cy.contains('button', 'Create').click();
    cy.contains('Probability is a percent, 0-100').should('be.visible');
  });

  it('starts a new deal at zero value and 10% confidence', () => {
    mount();
    cy.get('input[name="value"]').should('have.value', '0');
    cy.get('input[name="probability"]').should('have.value', '10');
  });

  it('invokes onCancel when Cancel is clicked', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
