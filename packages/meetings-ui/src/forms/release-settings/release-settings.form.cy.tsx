import type { MockedResponse } from '@apollo/client/testing';
import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { MaUpdateReleaseSettingsDocument } from '@exyconn/shell/graphql/generated';
import { ReleaseSettingsForm } from './release-settings.form';
import type { ReleaseSettingsValues } from './release-settings.types';

const INITIAL: ReleaseSettingsValues = {
  allowedRepository: 'acme/portal',
  slackChannelId: '',
  notifyOnNewBuild: false,
};
const CHANNELS = [
  { value: '', label: "Don't post to Slack" },
  { value: 'C1', label: '#releases' },
];
const SAVED_INPUT = {
  allowedRepository: 'acme/other',
  slackChannelId: 'C1',
  notifyOnNewBuild: true,
};

const saved: MockedResponse = {
  request: { query: MaUpdateReleaseSettingsDocument, variables: { input: SAVED_INPUT } },
  result: {
    data: {
      maUpdateReleaseSettings: {
        __typename: 'MaReleaseSettings',
        ...SAVED_INPUT,
        slackChannelName: 'releases',
        slackConfigured: true,
        updatedByName: 'root@exyconn.com',
        updatedAt: '2026-10-21T09:00:00.000Z',
      },
    },
  },
};
const refused: MockedResponse = {
  request: { query: MaUpdateReleaseSettingsDocument, variables: { input: INITIAL } },
  error: new Error('Release managers only'),
};

const mount = (channels = CHANNELS, mocks: MockedResponse[] = []) =>
  cy.mount(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <ReleaseSettingsForm
            initial={INITIAL}
            channels={channels}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('ReleaseSettingsForm', () => {
  it('requires the repository as owner/name, under 200 characters', () => {
    mount();
    cy.get('input[name="allowedRepository"]').clear().blur();
    cy.contains('Enter the repository').should('be.visible');
    cy.get('input[name="allowedRepository"]').type('acme').blur();
    cy.contains('Enter it as owner/name, e.g. acme/portal').should('be.visible');
    cy.get('input[name="allowedRepository"]').clear().type('acme/portal/extra').blur();
    cy.contains('Enter it as owner/name, e.g. acme/portal').should('be.visible');
    cy.get('input[name="allowedRepository"]')
      .clear()
      .type(`${'a'.repeat(150)}/${'b'.repeat(60)}`, { delay: 0 })
      .blur();
    cy.contains('Keep the repository under 200 characters').should('be.visible');
    cy.contains('button', 'Update').click();
    cy.get('@done').should('not.have.been.called');
  });

  it('hides the Slack choices when Slack offers no channel', () => {
    mount([]);
    cy.get('input[name="allowedRepository"]').should('have.value', 'acme/portal');
    cy.get('input[name="slackChannelId"]').should('not.exist');
    cy.contains('Also post when a new build arrives for QA').should('not.exist');
  });

  it('saves the trimmed repository, the channel and the QA post, then closes', () => {
    mount(CHANNELS, [saved]);
    cy.get('input[name="slackChannelId"]').should('have.value', "Don't post to Slack");
    cy.get('input[name="allowedRepository"]').clear().type(' acme/other ');
    cy.get('input[name="slackChannelId"]').click();
    cy.contains('[role="option"]', '#releases').click();
    cy.contains('label', 'Also post when a new build arrives for QA').click();
    cy.contains('button', 'Update').click();
    cy.contains('Release settings saved').should('be.visible');
    cy.get('@done').should('have.been.calledOnce');
  });

  it('stays open with the reason when the server refuses', () => {
    mount(CHANNELS, [refused]);
    cy.contains('button', 'Update').click();
    cy.contains('Release managers only').should('be.visible');
    cy.get('@done').should('not.have.been.called');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.calledOnce');
  });
});
