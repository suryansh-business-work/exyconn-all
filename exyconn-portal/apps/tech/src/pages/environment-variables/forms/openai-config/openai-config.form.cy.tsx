import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { OpenAiConfigForm } from './openai-config.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <OpenAiConfigForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('OpenAiConfigForm', () => {
  it('requires a label, an API key and a model', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Label is required').should('be.visible');
    cy.contains('API key is required').should('be.visible');
    cy.contains('Model is required').should('be.visible');
  });

  it('rejects a value that is not an OpenAI secret key', () => {
    mount();
    cy.get('input[name="apiKey"]').type('not-a-key');
    cy.contains('button', 'Create').click();
    cy.contains('API key must start with "sk-"').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
