import { SignInForm } from './sign-in.form';
import type { SignInFormProps } from './sign-in.types';

const PASSWORD = `pw-${Date.now()}`;

function mount(overrides: Partial<SignInFormProps> = {}) {
  cy.mount(
    <SignInForm
      submitPassword={cy.stub().as('password').resolves({ mfaChallenge: null })}
      submitCode={cy.stub().as('code').resolves({ mfaChallenge: null })}
      onSignedIn={cy.stub().as('signedIn')}
      {...overrides}
    />,
  );
}

describe('SignInForm', () => {
  it('asks for an email and a password', () => {
    mount();
    cy.contains('button', 'Sign in').click();
    cy.contains('Email is required').should('be.visible');
    cy.contains('Password is required').should('be.visible');
    cy.get('@password').should('not.have.been.called');
  });

  it('refuses an address that is not an email', () => {
    mount();
    cy.get('input[name="email"]').type('not-an-email').blur();
    cy.contains('Enter a valid email').should('be.visible');
  });

  it('signs in with the email and password', () => {
    mount();
    cy.get('input[name="email"]').type('ravi@exyconn.com');
    cy.get('input[name="password"]').type(PASSWORD);
    cy.contains('button', 'Sign in').click();
    cy.get('@password').should('have.been.calledOnceWith', {
      email: 'ravi@exyconn.com',
      password: PASSWORD,
      remember: true,
    });
    cy.get('@signedIn').should('have.been.calledOnce');
  });

  it('asks for the two-factor code when the account has it on', () => {
    mount({ submitPassword: cy.stub().as('password').resolves({ mfaChallenge: 'c1' }) });
    cy.get('input[name="email"]').type('ravi@exyconn.com');
    cy.get('input[name="password"]').type(PASSWORD);
    cy.contains('button', 'Sign in').click();
    cy.contains('button', 'Verify').click();
    cy.contains('Enter the six-digit code from your authenticator app').should('be.visible');
    cy.get('input[name="code"]').type('123456');
    cy.contains('button', 'Verify').click();
    cy.get('@code').should('have.been.calledOnceWith', 'c1', '123456', true);
    cy.get('@signedIn').should('have.been.calledOnce');
  });

  it("shows the portal's refusal and lets the person try again", () => {
    mount({
      submitPassword: cy.stub().as('password').rejects(new Error('Invalid email or password')),
    });
    cy.get('input[name="email"]').type('ravi@exyconn.com');
    cy.get('input[name="password"]').type(PASSWORD);
    cy.contains('button', 'Sign in').click();
    cy.contains('Invalid email or password').should('be.visible');
    cy.get('@signedIn').should('not.have.been.called');
  });
});
