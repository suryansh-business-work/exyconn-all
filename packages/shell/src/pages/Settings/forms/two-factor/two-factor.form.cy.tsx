import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@/components/ui/styles';
import { NotificationProvider } from '@/components/feedback/NotificationProvider';
import { theme } from '@/config/theme';
import { ConfirmMfaEnrolmentDocument, StartMfaEnrolmentDocument } from '@/graphql/generated';
import { TwoFactorForm } from './two-factor.form';

// A throwaway base32 secret: the form only scans it into a picture and prints it.
const SECRET = 'JBSWY3DPEHPK3PXP';
const RECOVERY_CODES = ['1111-2222', '3333-4444'];

const started = {
  request: { query: StartMfaEnrolmentDocument },
  result: {
    data: {
      startMfaEnrolment: {
        __typename: 'MfaEnrolment',
        secret: SECRET,
        uri: `otpauth://totp/Exyconn:someone@exyconn.com?secret=${SECRET}&issuer=Exyconn`,
      },
    },
  },
};

const confirmed = {
  request: { query: ConfirmMfaEnrolmentDocument, variables: { code: '123456' } },
  result: { data: { confirmMfaEnrolment: RECOVERY_CODES } },
};

const rejected = {
  request: { query: ConfirmMfaEnrolmentDocument, variables: { code: '000000' } },
  error: new Error('That code was not accepted.'),
};

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[started, confirmed, rejected]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <TwoFactorForm onEnrolled={cy.stub().as('enrolled')} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('TwoFactorForm', () => {
  it('offers the secret as a picture and as text, so a device that cannot scan can still enrol', () => {
    mount();
    cy.get('img[alt="QR code for your authenticator app"]')
      .should('be.visible')
      // Drawn in the browser: a secret that travelled to an image service would be published.
      .and(($img) => expect($img.attr('src')).to.match(/^data:image\/png;base64,/));
    cy.contains(SECRET).should('be.visible');
  });

  it('asks for all six digits before it will turn anything on', () => {
    mount();
    cy.get('input[name="code"]').type('123');
    cy.contains('button', 'Turn on').click();
    cy.contains('Enter the six digits your app is showing').should('be.visible');
    cy.get('@enrolled').should('not.have.been.called');
  });

  it('hands back the recovery codes once the code is accepted', () => {
    mount();
    cy.get('input[name="code"]').type('123456');
    cy.contains('button', 'Turn on').click();
    cy.get('@enrolled').should('have.been.calledWith', RECOVERY_CODES);
  });

  it('says so and clears the field when the code is refused, so the next try starts clean', () => {
    mount();
    cy.get('input[name="code"]').type('000000');
    cy.contains('button', 'Turn on').click();
    cy.contains('That code was not accepted.').should('be.visible');
    cy.get('input[name="code"]').should('have.value', '');
    cy.get('@enrolled').should('not.have.been.called');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
