import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { SlackConfigForm } from './slack-config.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <SlackConfigForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('SlackConfigForm', () => {
  it('requires the key Slack fields', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Label is required').should('be.visible');
    cy.contains('Bot token is required').should('be.visible');
    cy.contains('Default channel is required').should('be.visible');
  });

  it('rejects a token that is not a bot token', () => {
    mount();
    cy.get('input[name="label"]').type('Workspace');
    cy.get('input[name="botToken"]').type('xoxp-not-a-bot-token');
    cy.get('input[name="defaultChannel"]').type('#releases');
    cy.contains('button', 'Create').click();
    cy.contains('A Slack bot token starts with "xoxb-"').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
