import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { SendTestSlackForm } from './send-test-slack.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <SendTestSlackForm
            configId="config-1"
            configLabel="Primary workspace"
            onDone={cy.stub()}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('SendTestSlackForm', () => {
  it('requires a channel', () => {
    mount();
    cy.contains('button', 'Send test').click();
    cy.contains('Channel is required').should('be.visible');
  });

  it('names the configuration being verified', () => {
    mount();
    cy.contains('Primary workspace').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
