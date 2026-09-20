import { MockedProvider } from '@apollo/client/testing/react';
import { type MockedResponse } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { CreateClientSupportTicketDocument } from '@exyconn/shell/graphql/generated';
import { RaiseTicketForm } from './raise-ticket.form';

const input = {
  requesterName: 'Sam Khan',
  requesterEmail: 'sam@acme.com',
  subject: 'Cannot sign in to the portal',
  category: 'OTHER',
  priority: 'MEDIUM',
  description: 'Since this morning my password is refused on every portal. Nothing has changed.',
};

const raised: MockedResponse = {
  request: { query: CreateClientSupportTicketDocument, variables: { input } },
  result: { data: { createClientSupportTicket: 'EXY-4KQ7W2' } },
};

const refused: MockedResponse = {
  request: { query: CreateClientSupportTicketDocument, variables: { input } },
  error: new Error('Too many requests from this address. Try again later.'),
};

const mount = (mocks: MockedResponse[] = []) =>
  cy.mount(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <RaiseTicketForm
            onSubmitted={cy.stub().as('submitted')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

const fill = () => {
  cy.get('input[name="requesterName"]').type(input.requesterName);
  cy.get('input[name="requesterEmail"]').type(input.requesterEmail);
  cy.get('input[name="subject"]').type(input.subject);
  cy.get('textarea[name="description"]').type(input.description);
};

describe('the public ask-for-help form', () => {
  it('asks for everything the desk needs before it will send', () => {
    mount();
    cy.contains('button', 'Ask for help').click();

    cy.contains('Tell us who you are').should('be.visible');
    cy.contains('We need an address to reply to').should('be.visible');
    cy.contains('One line about what is wrong').should('be.visible');
  });

  it('refuses a description too short to act on', () => {
    mount();
    cy.get('input[name="requesterName"]').type(input.requesterName);
    cy.get('input[name="requesterEmail"]').type(input.requesterEmail);
    cy.get('input[name="subject"]').type(input.subject);
    cy.get('textarea[name="description"]').type('broken');
    cy.contains('button', 'Ask for help').click();

    cy.contains('A few sentences help us').should('be.visible');
  });

  it('hands back the reference the server minted', () => {
    mount([raised]);
    fill();
    cy.contains('button', 'Ask for help').click();

    cy.get('@submitted').should('have.been.calledWith', 'EXY-4KQ7W2');
  });

  it('says what went wrong when the desk refuses it', () => {
    mount([refused]);
    fill();
    cy.contains('button', 'Ask for help').click();

    cy.contains('Too many requests').should('be.visible');
    cy.get('@submitted').should('not.have.been.called');
  });
});
