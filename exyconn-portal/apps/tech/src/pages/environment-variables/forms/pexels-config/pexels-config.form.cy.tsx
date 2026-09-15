import { MockedProvider } from '@apollo/client/testing/react';
import { type MockedResponse } from '@apollo/client/testing';
import { UpdatePexelsConfigDocument } from '@exyconn/shell/graphql/generated';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { PexelsConfigForm } from './pexels-config.form';
import type { PexelsConfigRow } from './pexels-config.types';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

/** A stored config as the list returns it: the secret itself is never in it. */
const stored: PexelsConfigRow = {
  id: 'c1',
  label: 'Stock',
  hasApiKey: true,
  apiKeyHint: 'wxyz',
  isActive: true,
};

/** Saving the stored config untouched sends a blank secret, which the server reads as "keep". */
const keepSecretMock: MockedResponse = {
  request: {
    query: UpdatePexelsConfigDocument,
    variables: { id: 'c1', input: { label: 'Stock', apiKey: '', isActive: true } },
  },
  result: { data: { updatePexelsConfig: { id: 'c1' } } },
};

const mount = (initial: PexelsConfigRow | null = null, mocks: MockedResponse[] = []) =>
  cy.mount(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <PexelsConfigForm
            initial={initial}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('PexelsConfigForm', () => {
  it('requires a label and an API key', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Label is required').should('be.visible');
    cy.contains('API key is required').should('be.visible');
  });

  it('rejects a truncated API key', () => {
    mount();
    cy.get('input[name="apiKey"]').type('too-short');
    cy.contains('button', 'Create').click();
    cy.contains('API key must be at least 32 characters').should('be.visible');
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
