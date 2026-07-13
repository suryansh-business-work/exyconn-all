import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@/components/ui/styles';
import { SupportTicketForm } from './support-ticket.form';
import { NotificationProvider } from '../../../../components/feedback/NotificationProvider';
import { theme } from '../../../../config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <SupportTicketForm onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('SupportTicketForm', () => {
  it('requires the subject and description', () => {
    mount();
    cy.contains('button', 'Raise ticket').click();
    cy.contains('Subject is required').should('be.visible');
    cy.contains('Description is required').should('be.visible');
  });

  it('invokes onCancel when Cancel is clicked', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
