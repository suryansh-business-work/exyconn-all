import { MockedProvider } from '@apollo/client/testing/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { AuthProvider } from '@exyconn/shell/auth/AuthContext';
import { theme } from '@exyconn/shell/config/theme';
import { color } from '@exyconn/ui';
import { SignupCodeForm } from './signup-code.form';

const DETAILS = {
  name: 'Ada Lovelace',
  email: 'ada@newco.example',
  companyName: 'New Co',
  currency: 'GBP',
  country: 'GB',
  planId: 'plan-growth',
};

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <AuthProvider>
            <SignupCodeForm
              details={DETAILS}
              accentColor={color.blue[600]}
              onStartOver={cy.stub().as('startOver')}
            />
          </AuthProvider>
        </MemoryRouter>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('SignupCodeForm', () => {
  it('says where the code went and asks for it', () => {
    mount();
    cy.contains('We sent a six-digit code to ada@newco.example.').should('be.visible');
    cy.contains('button', 'Create my company').click();
    cy.contains('Enter the code from the email').should('be.visible');
  });

  it('refuses a code that is not six digits', () => {
    mount();
    cy.get('input[name="code"]').type('12ab');
    cy.contains('button', 'Create my company').click();
    cy.contains('The code is six digits').should('be.visible');
  });

  it('goes back to fix the email', () => {
    mount();
    cy.contains('button', 'Use a different email').click();
    cy.get('@startOver').should('have.been.called');
  });
});
