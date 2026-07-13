import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@/components/ui/styles';
import { SendTestEmailForm } from './send-test-email.form';
import { NotificationProvider } from '../../../../../components/feedback/NotificationProvider';
import { theme } from '../../../../../config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <SendTestEmailForm
            configId="config-1"
            configLabel="Primary SMTP"
            onDone={cy.stub()}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('SendTestEmailForm', () => {
  it('requires a recipient email', () => {
    mount();
    cy.contains('button', 'Send test').click();
    cy.contains('Recipient email is required').should('be.visible');
  });

  it('validates the email format', () => {
    mount();
    cy.get('input[name="to"]').type('not-an-email');
    cy.contains('button', 'Send test').click();
    cy.contains('Enter a valid email').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
