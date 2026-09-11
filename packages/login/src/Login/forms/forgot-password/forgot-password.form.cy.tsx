import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { RequestPasswordResetDocument } from '@exyconn/shell/graphql/generated';
import { ForgotPasswordForm, RESET_REQUESTED_MESSAGE } from './forgot-password.form';

const requestMock = {
  request: { query: RequestPasswordResetDocument, variables: { email: 'jane@exyconn.com' } },
  result: { data: { requestPasswordReset: true } },
};

const mount = (onDone = cy.stub().as('onDone')) =>
  cy.mount(
    <MockedProvider mocks={[requestMock]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <ForgotPasswordForm onCancel={cy.stub().as('onCancel')} onDone={onDone} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('ForgotPasswordForm', () => {
  it('requires an email', () => {
    mount();
    cy.contains('button', 'Send reset link').click();
    cy.contains('Email is required').should('be.visible');
  });

  it('validates the email format', () => {
    mount();
    cy.get('input[name="email"]').type('not-an-email');
    cy.contains('button', 'Send reset link').click();
    cy.contains('Enter a valid email').should('be.visible');
  });

  it('shows the same message whatever the address and closes', () => {
    mount();
    cy.get('input[name="email"]').type('jane@exyconn.com');
    cy.contains('button', 'Send reset link').click();
    cy.contains(RESET_REQUESTED_MESSAGE).should('be.visible');
    cy.get('@onDone').should('have.been.calledOnce');
  });

  it('cancels without sending', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@onCancel').should('have.been.calledOnce');
  });
});
