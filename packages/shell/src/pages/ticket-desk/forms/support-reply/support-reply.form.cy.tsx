import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { SupportReplyForm } from './support-reply.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <SupportReplyForm
            ticketId="ticket-1"
            onDone={cy.stub()}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('SupportReplyForm', () => {
  it('refuses an empty reply', () => {
    mount();
    cy.contains('button', 'Send').click();
    cy.contains('Write something before sending').should('be.visible');
  });

  it('makes the visibility choice explicit rather than a checkbox', () => {
    mount();
    cy.contains('Visibility').should('be.visible');
  });

  it('clears the error once a message is typed', () => {
    mount();
    cy.contains('button', 'Send').click();
    cy.contains('Write something before sending').should('be.visible');
    cy.get('textarea[name="body"]').type('We have restarted the service.');
    cy.contains('Write something before sending').should('not.exist');
  });

  it('invokes onCancel when Cancel is clicked', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
