import { MockedProvider } from '@apollo/client/testing';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { ResetPasswordDocument } from '@exyconn/shell/graphql/generated';
import { ResetPasswordForm, PASSWORD_RESET_MESSAGE } from './reset-password.form';

const TOKEN = 'abc123';

const resetMock = {
  request: { query: ResetPasswordDocument, variables: { token: TOKEN, newPassword: 'Fresh@456' } },
  result: { data: { resetPassword: true } },
};

const expiredMock = {
  request: { query: ResetPasswordDocument, variables: { token: TOKEN, newPassword: 'Stale@456' } },
  error: new Error('This reset link is invalid or has expired. Request a new one.'),
};

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[resetMock, expiredMock]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <MemoryRouter>
            <ResetPasswordForm token={TOKEN} accentColor="#155dfc" />
          </MemoryRouter>
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('ResetPasswordForm', () => {
  it('requires both fields', () => {
    mount();
    cy.get('button[type="submit"]').click();
    cy.contains('New password is required').should('be.visible');
    cy.contains('Confirm your new password').should('be.visible');
  });

  it('enforces the minimum length and a matching confirmation', () => {
    mount();
    cy.get('input[name="newPassword"]').type('abc');
    cy.get('input[name="confirmPassword"]').type('abd');
    cy.get('button[type="submit"]').click();
    cy.contains('Minimum 6 characters').should('be.visible');
    cy.get('input[name="newPassword"]').clear().type('Fresh@456');
    cy.get('button[type="submit"]').click();
    cy.contains('Passwords do not match').should('be.visible');
  });

  it('resets the password and confirms', () => {
    mount();
    cy.get('input[name="newPassword"]').type('Fresh@456');
    cy.get('input[name="confirmPassword"]').type('Fresh@456');
    cy.get('button[type="submit"]').click();
    cy.contains(PASSWORD_RESET_MESSAGE).should('be.visible');
  });

  it('shows the server message for a dead link', () => {
    mount();
    cy.get('input[name="newPassword"]').type('Stale@456');
    cy.get('input[name="confirmPassword"]').type('Stale@456');
    cy.get('button[type="submit"]').click();
    cy.contains('invalid or has expired').should('be.visible');
  });
});
