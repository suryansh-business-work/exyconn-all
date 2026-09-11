import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { SubscribeForm } from './subscribe.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <SubscribeForm onSubmitted={cy.stub().as('submitted')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('SubscribeForm', () => {
  it('requires an address', () => {
    mount();
    cy.contains('button', 'Email me updates').click();
    cy.contains('Enter your email address').should('be.visible');
  });

  it('rejects an address that is not one', () => {
    mount();
    cy.get('input[name="email"]').type('not-an-address');
    cy.contains('button', 'Email me updates').click();
    cy.contains('Enter a valid email address').should('be.visible');
  });

  it('does not report the outcome before the server has answered', () => {
    mount();
    cy.get('input[name="email"]').type('asha@example.com');
    cy.get('@submitted').should('not.have.been.called');
  });
});
