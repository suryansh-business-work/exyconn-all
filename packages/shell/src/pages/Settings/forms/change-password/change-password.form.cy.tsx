import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@/components/ui/styles';
import { ChangePasswordForm } from './change-password.form';
import { NotificationProvider } from '@/components/feedback/NotificationProvider';
import { theme } from '@/config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <ChangePasswordForm />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('ChangePasswordForm', () => {
  it('validates required fields', () => {
    mount();
    cy.contains('button', 'Update').click();
    cy.contains('Current password is required').should('be.visible');
    cy.contains('New password is required').should('be.visible');
  });

  it('enforces minimum length and matching confirmation', () => {
    mount();
    cy.get('input[name="currentPassword"]').type('oldpass1');
    cy.get('input[name="newPassword"]').type('123');
    cy.contains('Minimum 6 characters').should('be.visible');

    cy.get('input[name="newPassword"]').clear().type('newpass1');
    cy.get('input[name="confirmPassword"]').type('different');
    cy.contains('Passwords do not match').should('be.visible');
  });
});
