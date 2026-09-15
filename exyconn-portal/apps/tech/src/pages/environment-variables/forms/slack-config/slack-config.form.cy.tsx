import { MockedProvider } from '@apollo/client/testing/react';
import { type MockedResponse } from '@apollo/client/testing';
import { UpdateSlackConfigDocument } from '@exyconn/shell/graphql/generated';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { SlackConfigForm } from './slack-config.form';
import type { SlackConfigRow } from './slack-config.types';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

/** A stored config as the list returns it: the secret itself is never in it. */
const stored: SlackConfigRow = {
  id: 'c1',
  label: 'Workspace',
  hasBotToken: true,
  botTokenHint: 'wxyz',
  defaultChannel: '#releases',
  isActive: true,
};

/** Saving the stored config untouched sends a blank secret, which the server reads as "keep". */
const keepSecretMock: MockedResponse = {
  request: {
    query: UpdateSlackConfigDocument,
    variables: {
      id: 'c1',
      input: { label: 'Workspace', botToken: '', defaultChannel: '#releases', isActive: true },
    },
  },
  result: { data: { updateSlackConfig: { id: 'c1' } } },
};

const mount = (initial: SlackConfigRow | null = null, mocks: MockedResponse[] = []) =>
  cy.mount(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <SlackConfigForm
            initial={initial}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
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

  it('never prefills the stored secret and keeps it when left blank', () => {
    mount(stored, [keepSecretMock]);
    cy.get('input[name="botToken"]').should('have.value', '');
    cy.contains('Leave blank to keep the current value').should('be.visible');
    cy.contains('button', 'Update').click();
    cy.get('@done').should('have.been.called');
  });
});
