import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@/components/ui/styles';
import { NotificationProvider } from '@/components/feedback/NotificationProvider';
import { theme } from '@/config/theme';
import { DisableMfaDocument } from '@/graphql/generated';
import { DisableTwoFactorForm } from './disable-two-factor.form';

/**
 * What the person types, and what the mocked mutation expects to be asked with. Not a
 * credential: nothing authenticates against it, the mock answers on the string alone.
 */
const TYPED_VALUE = 'a-string-the-mock-answers-to';
const WRONG_VALUE = 'a-string-the-mock-refuses';

const disabled = {
  request: { query: DisableMfaDocument, variables: { password: TYPED_VALUE } },
  result: { data: { disableMfa: true } },
};

const refused = {
  request: { query: DisableMfaDocument, variables: { password: WRONG_VALUE } },
  error: new Error('That password was not accepted.'),
};

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[disabled, refused]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <DisableTwoFactorForm
            onDisabled={cy.stub().as('disabled')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('DisableTwoFactorForm', () => {
  it('will not take the second factor off an account without the password', () => {
    mount();
    cy.contains('button', 'Turn off').click();
    cy.contains('Your password is required').should('be.visible');
    cy.get('@disabled').should('not.have.been.called');
  });

  it('never shows the password it is given', () => {
    mount();
    cy.get('input[name="password"]').should('have.attr', 'type', 'password');
  });

  it('turns two-factor off once the password is accepted', () => {
    mount();
    cy.get('input[name="password"]').type(TYPED_VALUE);
    cy.contains('button', 'Turn off').click();
    cy.contains('Two-factor authentication is off.').should('be.visible');
    cy.get('@disabled').should('have.been.called');
  });

  it('keeps two-factor on and clears the field when the password is refused', () => {
    mount();
    cy.get('input[name="password"]').type(WRONG_VALUE);
    cy.contains('button', 'Turn off').click();
    cy.contains('That password was not accepted.').should('be.visible');
    cy.get('input[name="password"]').should('have.value', '');
    cy.get('@disabled').should('not.have.been.called');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
