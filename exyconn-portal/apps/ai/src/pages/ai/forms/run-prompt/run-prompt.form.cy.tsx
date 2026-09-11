import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { RunPromptForm } from './run-prompt.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import type { RunPromptTarget } from './run-prompt.types';

const prompt: RunPromptTarget = {
  id: 'prompt-1',
  title: 'Weekly digest',
  category: 'WRITING',
  content: 'Summarise the week',
  description: null,
  tags: [],
  variables: [],
};

const withVariables: RunPromptTarget = {
  ...prompt,
  content: 'Write to {{company}} about {{product}}',
  variables: ['company', 'product'],
};

const mount = (target: RunPromptTarget = prompt) =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <RunPromptForm prompt={target} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('RunPromptForm', () => {
  it('shows the prompt that is about to run', () => {
    mount();
    cy.contains('Summarise the week').should('be.visible');
  });

  it('will not run without a model', () => {
    mount();
    cy.contains('button', 'Run').click();
    cy.contains('Pick the model to run this on').should('be.visible');
  });

  it('asks for one value per placeholder the prompt declares', () => {
    mount(withVariables);
    cy.get('input[name="variables.company"]').should('exist');
    cy.get('input[name="variables.product"]').should('exist');
  });

  it('previews the prompt as it fills in', () => {
    mount(withVariables);
    cy.get('input[name="variables.company"]').type('Acme');
    cy.contains('Write to Acme about {{product}}').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
