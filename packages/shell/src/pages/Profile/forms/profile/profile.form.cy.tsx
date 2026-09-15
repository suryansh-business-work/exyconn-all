import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@/components/ui/styles';
import { ProfileForm } from './profile.form';
import { AuthProvider } from '@/auth/AuthContext';
import { NotificationProvider } from '@/components/feedback/NotificationProvider';
import { theme } from '@/config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
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

  it('shows the sign-in email locked', () => {
    mount();
    cy.contains('label', 'Email').parent().find('input').should('be.disabled');
  });

  it('refuses a malformed phone, a link that is not a web address and an overlong bio', () => {
    mount();
    cy.get('input[name="name"]').clear().type('Valid Name');
    cy.get('input[name="phone"]').type('12ab');
    cy.get('input[name="socialLinks.github"]').type('github.com/asha');
    cy.get('textarea[name="brief"]').type('x'.repeat(601), { delay: 0 });
    cy.contains('button', 'Update').click();

    cy.contains('Enter a valid phone number').should('be.visible');
    cy.contains('Enter a full address starting with https://').should('be.visible');
    cy.contains('Keep your bio under 600 characters').should('be.visible');
  });

  it('accepts an empty phone, bio and links', () => {
    mount();
    cy.get('input[name="name"]').clear().type('Valid Name');
    cy.get('input[name="socialLinks.linkedin"]').type('https://linkedin.com/in/asha');
    cy.contains('button', 'Update').click();
    cy.contains('Enter a valid phone number').should('not.exist');
    cy.contains('Enter a full address starting with https://').should('not.exist');
  });
});
