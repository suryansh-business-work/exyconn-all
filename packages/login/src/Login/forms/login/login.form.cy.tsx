import { MockedProvider } from '@apollo/client/testing';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { LoginForm } from './login.form';
import { AuthProvider } from '@exyconn/shell/auth/AuthContext';
import { theme } from '@exyconn/shell/config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <AuthProvider>
            <LoginForm accentColor="#155dfc" />
          </AuthProvider>
        </MemoryRouter>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('LoginForm', () => {
  it('shows validation errors when submitting empty', () => {
    mount();
    cy.get('button[type="submit"]').click();
    cy.contains('Email is required').should('be.visible');
    cy.contains('Password is required').should('be.visible');
  });

  it('validates email format', () => {
    mount();
    cy.get('input[name="email"]').type('not-an-email');
    cy.get('input[name="password"]').type('secret123');
    cy.get('button[type="submit"]').click();
    cy.contains('Enter a valid email').should('be.visible');
  });

  it('toggles password visibility', () => {
    mount();
    cy.get('input[name="password"]').should('have.attr', 'type', 'password');
    cy.get('[aria-label="toggle password"]').click();
    cy.get('input[name="password"]').should('have.attr', 'type', 'text');
  });

  it('does not expose a one-click admin login helper', () => {
    mount();
    cy.contains('button', 'Login with Admin').should('not.exist');
  });
});
