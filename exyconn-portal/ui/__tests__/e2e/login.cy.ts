/**
 * End-to-end login flow. Uses a mocked GraphQL login response so the UI can be
 * validated during CI without a backend dependency.
 */
describe('Login flow', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/graphql', (req) => {
      if (req.body.operationName === 'Login') {
        req.reply({
          data: {
            login: {
              token: 'fake-jwt-token',
              user: {
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

  it('renders the animated 3D login screen with the brand logo', () => {
    cy.visit('/login');
    cy.get('img[alt="Exyconn"]').should('be.visible');
    cy.contains('Log in').should('be.visible');
    cy.get('video').should('exist');
  });

  it('logs in as admin and lands on the portal', () => {
    cy.visit('/login');
    cy.get('input[name="email"]').type('admin@exyconn.com');
    cy.get('input[name="password"]').type('Admin@1234');
    cy.get('button[aria-label="Log in"]').click();
    cy.wait('@loginRequest');
    cy.url().should('include', '/portal');
    cy.contains('You have access to').should('be.visible');
  });

  it('blocks the portal when unauthenticated', () => {
    cy.clearLocalStorage();
    cy.visit('/portal');
    cy.url().should('include', '/login');
  });
});
