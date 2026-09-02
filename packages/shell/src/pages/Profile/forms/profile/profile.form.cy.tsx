import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@/components/ui/styles';
import { ProfileForm } from './profile.form';
import { AuthProvider } from '@/auth/AuthContext';
import { NotificationProvider } from '@/components/feedback/NotificationProvider';
import { theme } from '@/config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <NotificationProvider>
            <ProfileForm />
          </NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    </MockedProvider>,
  );

describe('ProfileForm', () => {
  it('requires a name with at least 2 characters', () => {
    mount();
    cy.get('input[name="name"]').clear();
    cy.contains('button', 'Update').click();
    cy.contains('Name is required').should('be.visible');

    cy.get('input[name="name"]').type('A');
    cy.contains('Minimum 2 characters').should('be.visible');
  });

  it('accepts a valid name', () => {
    mount();
    cy.get('input[name="name"]').clear().type('Valid Name');
    cy.contains('Minimum 2 characters').should('not.exist');
  });
});
