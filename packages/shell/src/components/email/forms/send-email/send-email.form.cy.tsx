import { MockedProvider } from '@apollo/client/testing/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@/components/ui/styles';
import { NotificationProvider } from '@/components/feedback/NotificationProvider';
import { theme } from '@/config/theme';
import { CrmEmailProvider, GmailAccountStatus } from '@/graphql/generated';
import { SendEmailForm } from './send-email.form';

const MAILBOX = {
  id: 'm1',
  provider: CrmEmailProvider.Gmail,
  email: 'me@acme.io',
  status: GmailAccountStatus.Connected,
  lastError: '',
  lastErrorAt: null,
  connectedAt: null,
  isDefault: true,
};

const mount = (mailboxes = [MAILBOX]) =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <MemoryRouter>
            <SendEmailForm
              draft={{ to: ['ada@acme.io'] }}
              mailboxes={mailboxes}
              onDone={cy.stub()}
              onCancel={cy.stub().as('cancel')}
            />
          </MemoryRouter>
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('SendEmailForm', () => {
  it('starts addressed to the draft recipient, from the default mailbox', () => {
    mount();
    cy.contains('ada@acme.io').should('be.visible');
    cy.contains('me@acme.io (Gmail)').should('be.visible');
  });

  it('requires a subject and a message', () => {
    mount();
    cy.contains('button', 'Send').click();
    cy.contains('Write a subject').should('be.visible');
    cy.contains('Write the message').should('be.visible');
  });

  it('requires a mailbox to send from', () => {
    mount([]);
    cy.contains('button', 'Send').click();
    cy.contains('Choose the mailbox to send from').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
