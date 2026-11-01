import { ThemeProvider } from '@/components/ui/styles';
import { theme } from '@/config/theme';
import { EmailCodeSignInForm } from './email-code-sign-in.form';

const mount = () => {
  const requestCode = cy.stub().as('requestCode').resolves();
  const verifyCode = cy.stub().as('verifyCode').resolves('vendor-pass');
  cy.mount(
    <ThemeProvider theme={theme}>
      <EmailCodeSignInForm
        accentColor="#1d4ed8"
        requestCode={requestCode}
        verifyCode={verifyCode}
        onSignedIn={cy.stub().as('signedIn')}
      />
    </ThemeProvider>,
  );
  return { requestCode, verifyCode };
};

const sendCodeTo = (email: string) => {
  cy.get('input[name="email"]').type(email);
  cy.contains('button', 'Email me a code').click();
};

describe('EmailCodeSignInForm', () => {
  it('requires an email', () => {
    mount();
    cy.contains('button', 'Email me a code').click();
    cy.contains('Email is required').should('be.visible');
    cy.get('@requestCode').should('not.have.been.called');
  });

  it('rejects a malformed email', () => {
    mount();
    sendCodeTo('sam-at-acme');
    cy.contains('Enter a valid email').should('be.visible');
    cy.get('@requestCode').should('not.have.been.called');
  });

  it('shows why a code could not be sent', () => {
    const { requestCode } = mount();
    requestCode.rejects(new Error('This email does not have vendor portal access yet.'));
    sendCodeTo('sam@acme.test');
    cy.contains('This email does not have vendor portal access yet.').should('be.visible');
  });

  it('wants six digits for the code', () => {
    mount();
    sendCodeTo('Sam@Acme.test');
    cy.contains('We emailed a six-digit code to sam@acme.test').should('be.visible');
    cy.get('input[name="code"]').type('12a');
    cy.contains('button', 'Sign in').click();
    cy.contains('Enter the six-digit code from the email').should('be.visible');
    cy.get('@verifyCode').should('not.have.been.called');
  });

  it('signs in with the emailed code and hands the pass on', () => {
    mount();
    sendCodeTo('sam@acme.test');
    cy.get('input[name="code"]').type('123456');
    cy.contains('button', 'Sign in').click();
    cy.get('@verifyCode').should('have.been.calledWith', 'sam@acme.test', '123456');
    cy.get('@signedIn').should('have.been.calledWith', 'vendor-pass');
  });

  it('shows a refused code and lets the person start over', () => {
    const { verifyCode } = mount();
    verifyCode.rejects(new Error('That code is not right.'));
    sendCodeTo('sam@acme.test');
    cy.get('input[name="code"]').type('000000');
    cy.contains('button', 'Sign in').click();
    cy.contains('That code is not right.').should('be.visible');
    cy.contains('button', 'Use a different email or send a new code').click();
    cy.get('input[name="email"]').should('be.visible');
    cy.contains('That code is not right.').should('not.exist');
  });
});
