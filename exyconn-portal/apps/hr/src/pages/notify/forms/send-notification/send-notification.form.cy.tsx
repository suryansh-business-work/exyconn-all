import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { SendNotificationForm } from './send-notification.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <SendNotificationForm onSent={cy.stub().as('sent')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('SendNotificationForm', () => {
  it('requires a title', () => {
    mount();
    cy.contains('button', 'Send notification').click();
    cy.contains('Title is required').should('be.visible');
  });

  it('rejects an off-portal link', () => {
    mount();
    cy.get('input[name="title"]').type('Town hall');
    cy.get('input[name="link"]').type('https://evil.example');
    cy.contains('button', 'Send notification').click();
    cy.contains('Link must be an in-portal path').should('be.visible');
  });
});
