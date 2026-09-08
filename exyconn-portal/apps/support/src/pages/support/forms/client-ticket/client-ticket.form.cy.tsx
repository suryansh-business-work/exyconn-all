import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { ClientTicketForm } from './client-ticket.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <ClientTicketForm onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('ClientTicketForm', () => {
  it('refuses an empty form', () => {
    mount();
    cy.contains('button', 'Raise ticket').click();
    cy.contains('Give the customer').should('be.visible');
    cy.contains('Enter a valid email address').should('be.visible');
    cy.contains('Add a short subject').should('be.visible');
  });

  it('refuses a description that says nothing', () => {
    mount();
    cy.get('input[name="requesterName"]').type('Dana Reyes');
    cy.get('input[name="requesterEmail"]').type('dana@acme.test');
    cy.get('input[name="subject"]').type('Portal will not load');
    cy.get('textarea[name="description"]').type('broken');
    cy.contains('button', 'Raise ticket').click();
    cy.contains('Describe the issue in a bit more detail').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
