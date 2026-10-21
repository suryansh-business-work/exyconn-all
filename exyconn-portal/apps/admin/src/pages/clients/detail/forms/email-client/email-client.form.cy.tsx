import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { ClientEmailRecipientsDocument } from '@exyconn/shell/graphql/generated';
import { EmailClientForm } from './email-client.form';

const recipients = {
  request: { query: ClientEmailRecipientsDocument, variables: { clientId: 'client-1' } },
  result: {
    data: {
      clientEmailRecipients: [
        { __typename: 'ClientEmailRecipient', name: 'Dana', email: 'dana@acme.example' },
      ],
    },
  },
};

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[recipients]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <EmailClientForm
            clientId="client-1"
            onDone={cy.stub()}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('EmailClientForm', () => {
  it('picks every address on file and requires a subject and message', () => {
    mount();
    cy.contains('Dana <dana@acme.example>').should('be.visible');
    cy.contains('button', 'Send').click();
    cy.contains('Write a subject').should('be.visible');
    cy.contains('Write a message').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
