import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { EmailFragmentForm } from './email-fragment.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <EmailFragmentForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('EmailFragmentForm', () => {
  it('requires a key, a name and a body', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Key is required').should('be.visible');
    cy.contains('Name is required').should('be.visible');
    cy.contains('The fragment cannot be empty').should('be.visible');
  });

  it('keeps the key to a stable lower-case identifier', () => {
    mount();
    cy.get('input[name="key"]').type('Shared Header');
    cy.contains('button', 'Create').click();
    cy.contains('Lower-case letters, numbers and hyphens only').should('be.visible');
  });

  it('invokes onCancel when Cancel is clicked', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
