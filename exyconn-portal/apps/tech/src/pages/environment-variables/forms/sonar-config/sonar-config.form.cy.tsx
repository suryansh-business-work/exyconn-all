import { MockedProvider } from '@apollo/client/testing/react';
import type { MockLink } from '@apollo/client/testing';
import {
  CreateSonarConfigDocument,
  UpdateSonarConfigDocument,
} from '@exyconn/shell/graphql/generated';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { SonarConfigForm } from './sonar-config.form';
import type { SonarConfigRow } from './sonar-config.types';

/** Never a literal credential: the value only has to look like a token. */
const TOKEN = `squ_${'x'.repeat(20)}`;

/** A stored config as the list returns it: the token itself is never in it. */
const stored: SonarConfigRow = {
  id: 's1',
  label: 'SonarCloud',
  hostUrl: 'https://sonarcloud.io',
  projectKey: 'exyconn_all',
  organization: 'exyconn',
  hasToken: true,
  tokenHint: 'wxyz',
  isActive: true,
};

const createMock: MockLink.MockedResponse = {
  request: {
    query: CreateSonarConfigDocument,
    variables: {
      input: {
        label: 'Self-hosted',
        hostUrl: 'https://sonar.example.test',
        token: TOKEN,
        projectKey: 'com.exyconn:portal',
        organization: '',
        isActive: true,
      },
    },
  },
  result: { data: { createSonarConfig: { id: 's2' } } },
};

/** Saving the stored config untouched sends a blank token, which the server reads as "keep". */
const keepTokenMock: MockLink.MockedResponse = {
  request: {
    query: UpdateSonarConfigDocument,
    variables: {
      id: 's1',
      input: {
        label: 'SonarCloud',
        hostUrl: 'https://sonarcloud.io',
        token: '',
        projectKey: 'exyconn_all',
        organization: 'exyconn',
        isActive: true,
      },
    },
  },
  result: { data: { updateSonarConfig: { id: 's1' } } },
};

const mount = (initial: SonarConfigRow | null = null, mocks: MockLink.MockedResponse[] = []) =>
  cy.mount(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <SonarConfigForm
            initial={initial}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

/** Fills every required field with valid values; each test then spoils one. */
const fillValid = () => {
  cy.get('input[name="label"]').type('Self-hosted');
  cy.get('input[name="hostUrl"]').type('https://sonar.example.test');
  cy.get('input[name="token"]').type(TOKEN);
  cy.get('input[name="projectKey"]').type('com.exyconn:portal');
};

describe('SonarConfigForm', () => {
  it('requires a label, a server, a token and a project key', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Label is required').should('be.visible');
    cy.contains('Server URL is required').should('be.visible');
    cy.contains('Token is required').should('be.visible');
    cy.contains('Project key is required').should('be.visible');
  });

  it('keeps the token masked', () => {
    mount();
    cy.get('input[name="token"]').should('have.attr', 'type', 'password');
  });

  it('refuses a server that is not https', () => {
    mount();
    fillValid();
    cy.get('input[name="hostUrl"]').clear().type('http://sonar.example.test');
    cy.contains('button', 'Create').click();
    cy.contains('Use an https:// address').should('be.visible');
    cy.get('input[name="hostUrl"]').clear().type('not a url');
    cy.contains('Enter a valid URL').should('be.visible');
  });

  it('refuses a project key SonarQube would not accept', () => {
    mount();
    fillValid();
    cy.get('input[name="projectKey"]').clear().type('my project');
    cy.contains('button', 'Create').click();
    cy.contains('Use the project key exactly as SonarQube shows it').should('be.visible');
    cy.get('input[name="projectKey"]').clear().type('12345');
    cy.contains('Use the project key exactly as SonarQube shows it').should('be.visible');
  });

  it('refuses an organization name in place of its key', () => {
    mount();
    fillValid();
    cy.get('input[name="organization"]').type('Exyconn Pvt Ltd');
    cy.contains('button', 'Create').click();
    cy.contains('Use the organization key, not its name').should('be.visible');
  });

  it('creates a config for a self-hosted server', () => {
    mount(null, [createMock]);
    fillValid();
    cy.contains('Set as active').parent().should('contain', 'Yes');
    cy.contains('button', 'Create').click();
    cy.get('@done').should('have.been.called');
  });

  it('never prefills the stored token and keeps it when left blank', () => {
    mount(stored, [keepTokenMock]);
    cy.get('input[name="token"]').should('have.value', '');
    cy.contains('Leave blank to keep the current value').should('be.visible');
    cy.contains('button', 'Update').click();
    cy.get('@done').should('have.been.called');
  });

  it('invokes onCancel when Cancel is clicked', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
