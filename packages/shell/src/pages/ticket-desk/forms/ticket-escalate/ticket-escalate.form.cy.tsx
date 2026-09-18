import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@/components/ui/styles';
import { NotificationProvider } from '@/components/feedback/NotificationProvider';
import { theme } from '@/config/theme';
import { EscalateSupportTicketDocument } from '@/graphql/generated';
import { TicketEscalateForm } from './ticket-escalate.form';

const escalated = {
  request: {
    query: EscalateSupportTicketDocument,
    variables: { id: 'ticket-1', reason: 'CEO cannot print' },
  },
  result: {
    data: {
      escalateSupportTicket: {
        __typename: 'SupportTicket',
        id: 'ticket-1',
        priority: 'HIGH',
        dueAt: null,
        slaState: 'ON_TRACK',
        escalationLevel: 1,
        escalatedAt: '2026-09-18T10:00:00.000Z',
      },
    },
  },
};

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[escalated]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <TicketEscalateForm
            ticketId="ticket-1"
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('TicketEscalateForm', () => {
  it('requires a reason', () => {
    mount();
    cy.contains('button', 'Escalate').click();
    cy.contains('Say why it needs escalating').should('be.visible');
  });

  it('escalates with the reason given', () => {
    mount();
    cy.get('textarea[name="reason"]').type('CEO cannot print');
    cy.contains('button', 'Escalate').click();
    cy.get('@done').should('have.been.called');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
