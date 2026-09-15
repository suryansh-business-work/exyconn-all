import { MockedProvider } from '@apollo/client/testing/react';
import { type MockedResponse } from '@apollo/client/testing';
import { UpdateOpenAiConfigDocument } from '@exyconn/shell/graphql/generated';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { OpenAiConfigForm } from './openai-config.form';
import type { OpenAiConfigRow } from './openai-config.types';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

/** A stored config as the list returns it: the secret itself is never in it. */
const stored: OpenAiConfigRow = {
  id: 'c1',
  label: 'Primary',
  hasApiKey: true,
  apiKeyHint: 'wxyz',
  defaultModel: 'gpt-4o-mini',
  isActive: true,
};

/** Saving the stored config untouched sends a blank secret, which the server reads as "keep". */
const keepSecretMock: MockedResponse = {
  request: {
    query: UpdateOpenAiConfigDocument,
    variables: {
      id: 'c1',
      input: { label: 'Primary', apiKey: '', defaultModel: 'gpt-4o-mini', isActive: true },
    },
  },
  result: { data: { updateOpenAiConfig: { id: 'c1' } } },
};

const mount = (initial: OpenAiConfigRow | null = null, mocks: MockedResponse[] = []) =>
  cy.mount(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <OpenAiConfigForm
            initial={initial}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
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

  it('never prefills the stored secret and keeps it when left blank', () => {
    mount(stored, [keepSecretMock]);
    cy.get('input[name="apiKey"]').should('have.value', '');
    cy.contains('Leave blank to keep the current value').should('be.visible');
    cy.contains('button', 'Update').click();
    cy.get('@done').should('have.been.called');
  });
});
