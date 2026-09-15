import { MockedProvider } from '@apollo/client/testing/react';
import { type MockedResponse } from '@apollo/client/testing';
import { UpdateGithubConfigDocument } from '@exyconn/shell/graphql/generated';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { GithubConfigForm } from './github-config.form';
import type { GithubConfigRow } from './github-config.types';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

/** A stored config as the list returns it: the secret itself is never in it. */
const stored: GithubConfigRow = {
  id: 'c1',
  label: 'Tracker builds',
  owner: 'exyconn',
  repo: 'exyconn-all',
  hasToken: true,
  tokenHint: 'wxyz',
  isActive: true,
};

/** Saving the stored config untouched sends a blank secret, which the server reads as "keep". */
const keepSecretMock: MockedResponse = {
  request: {
    query: UpdateGithubConfigDocument,
    variables: {
      id: 'c1',
      input: {
        label: 'Tracker builds',
        owner: 'exyconn',
        repo: 'exyconn-all',
        token: '',
        isActive: true,
      },
    },
  },
  result: { data: { updateGithubConfig: { id: 'c1' } } },
};

const mount = (initial: GithubConfigRow | null = null, mocks: MockedResponse[] = []) =>
  cy.mount(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <GithubConfigForm
            initial={initial}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('GithubConfigForm', () => {
  it('requires a label, an owner, a repository and a token', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Label is required').should('be.visible');
    cy.contains('Owner is required').should('be.visible');
    cy.contains('Repository is required').should('be.visible');
    cy.contains('Access token is required').should('be.visible');
  });

  it('keeps the access token masked', () => {
    mount();
    cy.get('input[name="token"]').should('have.attr', 'type', 'password');
  });

  it('rejects an owner pasted as a URL rather than a name', () => {
    mount();
    cy.get('input[name="label"]').type('Tracker builds');
    cy.get('input[name="owner"]').type('https://github.com/exyconn');
    cy.get('input[name="repo"]').type('exyconn-all');
    cy.get('input[name="token"]').type('a-token');
    cy.contains('button', 'Create').click();
    cy.contains('Use the owner exactly as it appears in the repository URL').should('be.visible');
  });

  it('rejects a repository name with a slash in it', () => {
    mount();
    cy.get('input[name="label"]').type('Tracker builds');
    cy.get('input[name="owner"]').type('exyconn');
    cy.get('input[name="repo"]').type('exyconn/exyconn-all');
    cy.get('input[name="token"]').type('a-token');
    cy.contains('button', 'Create').click();
    cy.contains('Use the repository name exactly as it appears in its URL').should('be.visible');
  });

  it('accepts an owner and repository that use dots, dashes and underscores', () => {
    mount();
    cy.get('input[name="label"]').type('Tracker builds');
    cy.get('input[name="owner"]').type('exy-conn_1');
    cy.get('input[name="repo"]').type('exyconn.all-app');
    cy.get('input[name="token"]').type('a-token');
    cy.contains('button', 'Create').click();
    cy.contains('Use the owner exactly as it appears in the repository URL').should('not.exist');
    cy.contains('Use the repository name exactly as it appears in its URL').should('not.exist');
  });

  it('defaults a new configuration to active', () => {
    mount();
    cy.contains('Set as active').parent().should('contain', 'Yes');
  });

  it('invokes onCancel when Cancel is clicked', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });

  it('never prefills the stored secret and keeps it when left blank', () => {
    mount(stored, [keepSecretMock]);
    cy.get('input[name="token"]').should('have.value', '');
    cy.contains('Leave blank to keep the current value').should('be.visible');
    cy.contains('button', 'Update').click();
    cy.get('@done').should('have.been.called');
  });
});
