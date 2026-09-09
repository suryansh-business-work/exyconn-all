import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { InboundMailConfigForm } from './inbound-mail-config.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <InboundMailConfigForm
            initial={null}
            onDone={cy.stub()}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('InboundMailConfigForm', () => {
  it('requires the mailbox credentials', () => {
    mount();
    cy.get('input[name="host"]').clear();
    cy.contains('button', 'Create').click();
    cy.contains('Label is required').should('be.visible');
    cy.contains('IMAP host is required').should('be.visible');
    cy.contains('Username is required').should('be.visible');
    cy.contains('Password is required').should('be.visible');
  });

  it('refuses a polling interval the mail server would throttle', () => {
    mount();
    cy.get('input[name="pollSeconds"]').clear().type('5');
    cy.contains('button', 'Create').click();
    cy.contains('Read the mailbox at most every 30 seconds').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
