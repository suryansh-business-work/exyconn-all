import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { TicketForm } from './ticket.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <TicketForm
            initial={null}
            assignees={[{ value: 'u1', label: 'Asha Rao' }]}
            onSubmit={cy.stub().as('submit').resolves()}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('TicketForm', () => {
  it('requires a summary', () => {
    mount();
    cy.contains('button', 'Save ticket').click();
    cy.contains('Summary is required').should('be.visible');
    cy.get('@submit').should('not.have.been.called');
  });

  it('rejects a fractional estimate', () => {
    mount();
    cy.get('input[name="title"]').type('Broken export');
    cy.get('input[name="storyPoints"]').type('2.5');
    cy.contains('button', 'Save ticket').click();
    cy.contains('Points must be whole').should('be.visible');
  });

  it('rejects a negative estimate', () => {
    mount();
    cy.get('input[name="title"]').type('Broken export');
    cy.get('input[name="storyPoints"]').type('-1');
    cy.contains('button', 'Save ticket').click();
    cy.contains('Points cannot be negative').should('be.visible');
  });

  it('submits the summary with the ticket defaults', () => {
    mount();
    cy.get('input[name="title"]').type('Broken export');
    cy.contains('button', 'Save ticket').click();
    cy.get('@submit').should('have.been.calledWithMatch', {
      title: 'Broken export',
      type: 'TASK',
      priority: 'MEDIUM',
    });
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
