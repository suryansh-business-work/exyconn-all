import { MockedProvider } from '@apollo/client/testing/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { AuthProvider } from '@exyconn/shell/auth/AuthContext';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { VerifyMfaDocument } from '@exyconn/shell/graphql/generated';
import { color } from '@exyconn/ui';
import { MfaChallengeForm } from './mfa.form';

const CHALLENGE = 'challenge-token';

const accepted = {
  request: { query: VerifyMfaDocument, variables: { challenge: CHALLENGE, code: '123456' } },
  result: {
    data: {
      verifyMfa: {
        token: 'session-token',
        mfaRequired: false,
        mfaChallenge: '',
        user: {
          id: 'u1',
          name: 'Asha Rao',
          email: 'asha@exyconn.com',
          roles: ['EMPLOYEE'],
          avatarUrl: null,
        },
      },
    },
  },
};

const refused = {
  request: { query: VerifyMfaDocument, variables: { challenge: CHALLENGE, code: '000000' } },
  error: new Error('That code is not right.'),
};

const mount = (mocks: unknown[] = []) =>
  cy.mount(
    <MockedProvider mocks={mocks as never}>
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <AuthProvider>
            <NotificationProvider>
              <MfaChallengeForm
                challenge={CHALLENGE}
                accentColor={color.blue[600]}
                onStartOver={cy.stub().as('startOver')}
              />
            </NotificationProvider>
          </AuthProvider>
        </MemoryRouter>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('the second step of a sign-in', () => {
  it('asks for a code and says a recovery code will do', () => {
    mount();
    cy.contains('or one of your recovery codes').should('be.visible');
  });

  it('refuses anything shorter than a code', () => {
    mount();
    cy.get('input[name="code"]').type('123');
    cy.get('button[type="submit"]').click();
    cy.contains('Enter the six-digit code').should('be.visible');
  });

  it('shows what the server said when the code is wrong, and clears the field', () => {
    mount([refused]);
    cy.get('input[name="code"]').type('000000');
    cy.get('button[type="submit"]').click();
    cy.contains('That code is not right.').should('be.visible');
    cy.get('input[name="code"]').should('have.value', '');
  });

  it('accepts a good code without complaint', () => {
    mount([accepted]);
    cy.get('input[name="code"]').type('123456');
    cy.get('button[type="submit"]').click();
    cy.contains('not right').should('not.exist');
  });

  it('can go back to the password step', () => {
    mount();
    cy.contains('Start again').click();
    cy.get('@startOver').should('have.been.called');
  });
});
