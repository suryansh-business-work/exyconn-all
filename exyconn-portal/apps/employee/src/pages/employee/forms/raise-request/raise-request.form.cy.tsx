import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { RaiseRequestForm } from './raise-request.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <RaiseRequestForm onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('RaiseRequestForm', () => {
  it('requires a subject and enough detail', () => {
    mount();
    cy.contains('button', 'Submit').click();
    cy.contains('Subject is required').should('be.visible');
    cy.contains('Give HR enough detail to act on (10+ characters)').should('be.visible');
  });

  it('rejects details that are too short', () => {
    mount();
    cy.get('input[name="subject"]').type('Laptop');
    cy.get('textarea[name="details"]').first().type('too short');
    cy.contains('button', 'Submit').click();
    cy.contains('Give HR enough detail to act on (10+ characters)').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
