import { MockedProvider } from '@apollo/client/testing/react';
import { type MockedResponse } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { ClientSupportTicketStatusDocument } from '@exyconn/shell/graphql/generated';
import { CheckTicketForm } from './check-ticket.form';

const variables = { reference: 'EXY-4KQ7W2', email: 'sam@acme.com' };

const found: MockedResponse = {
  request: { query: ClientSupportTicketStatusDocument, variables },
  result: {
    data: {
      clientSupportTicketStatus: {
        reference: 'EXY-4KQ7W2',
        subject: 'Cannot sign in to the portal',
        status: 'IN_PROGRESS',
        updatedAt: '2026-09-20T10:00:00Z',
        replies: [
          {
            id: 'r1',
            body: 'We have reset the lock on your account — try again now.',
            authorName: 'Asha Rao',
            createdAt: '2026-09-20T09:30:00Z',
          },
        ],
      },
    },
  },
};

const nothing: MockedResponse = {
  request: {
    query: ClientSupportTicketStatusDocument,
    variables: { reference: 'EXY-ZZZZZZ', email: 'sam@acme.com' },
  },
  result: { data: { clientSupportTicketStatus: null } },
};

const mount = (mocks: MockedResponse[] = []) =>
  cy.mount(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <CheckTicketForm onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('following a ticket without an account', () => {
  it('needs both the reference and the address', () => {
    mount();
    cy.contains('button', 'Check').click();

    cy.contains('The reference from your confirmation').should('be.visible');
    cy.contains('The address you raised it from').should('be.visible');
  });

  it('shows where the ticket is, and what was said publicly', () => {
    mount([found]);
    cy.get('input[name="reference"]').type('exy-4kq7w2');
    cy.get('input[name="email"]').type(variables.email);
    cy.contains('button', 'Check').click();

    cy.contains('EXY-4KQ7W2').should('be.visible');
    cy.contains('IN PROGRESS').should('be.visible');
    cy.contains('reset the lock').should('be.visible');
    cy.contains('Asha Rao').should('be.visible');
  });

  it('says the same thing for a wrong reference as for somebody else s ticket', () => {
    mount([nothing]);
    cy.get('input[name="reference"]').type('EXY-ZZZZZZ');
    cy.get('input[name="email"]').type(variables.email);
    cy.contains('button', 'Check').click();

    cy.contains('No ticket matches that reference and address').should('be.visible');
  });
});
