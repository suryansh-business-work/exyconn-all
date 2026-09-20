/**
 * End-to-end login flow. Uses a mocked GraphQL login response so the UI can be
 * validated during CI without a backend dependency.
 */
describe('Login flow', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/graphql', (req) => {
      if (req.body.operationName === 'Login') {
        // Every field the operation asks for, including the two-factor ones: a reply that
        // omits a selected field is a reply Apollo may refuse, and then the test would be
        // failing on its own stub rather than on the portal.
        req.reply({
          data: {
            login: {
              __typename: 'AuthPayload',
              token: 'fake-jwt-token',
              mfaRequired: false,
              mfaChallenge: '',
              user: {
                __typename: 'User',
                id: '1',
                name: 'Exyconn Admin',
                email: 'admin@exyconn.com',
                roles: ['ADMIN'],
                avatarUrl: null,
              },
            },
          },
        });
      }
    }).as('loginRequest');
  });

  it('renders the sign-in screen with the brand logo', () => {
    cy.visit('/login');
    cy.get('img[alt="Exyconn"]').should('be.visible');
    cy.contains('button', 'Log in').should('be.visible');
  });

  it('logs in as admin and lands on the module launcher', () => {
    cy.visit('/login');
    cy.get('input[name="email"]').type('admin@exyconn.com');
    // The login request is intercepted above, so the password is never checked — and no real
    // credential belongs in a spec.
    cy.get('input[name="password"]').type(`e2e-${Date.now()}`);
    cy.contains('button', 'Log in').click();
    cy.wait('@loginRequest');
    cy.contains('You have access to').should('be.visible');
  });

  it('blocks the portal when unauthenticated', () => {
    // The session lives in a cookie shared across the portal subdomains, so
    // clearing localStorage alone would leave the user signed in.
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.visit('/portal');
    cy.url().should('include', '/login');
  });
});
