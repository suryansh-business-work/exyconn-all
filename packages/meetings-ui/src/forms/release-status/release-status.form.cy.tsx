import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { MaReleaseChannel, MaReleaseStatus } from '@exyconn/shell/graphql/generated';
import { ReleaseStatusForm } from './release-status.form';
import type { ReleaseRow } from './release-status.types';

const RELEASE: ReleaseRow = {
  id: 'release-1',
  version: '1.4.0',
  channel: MaReleaseChannel.Stable,
  buildNumber: 42,
  commitSha: 'a1b2c3',
  builtAt: '2026-10-20T09:00:00.000Z',
  artifactName: 'x.zip',
  artifactSize: 10,
  sha256: 'ff',
  releaseNotes: '',
  minChromeVersion: '120',
  status: MaReleaseStatus.QaPending,
  storeItemId: '',
  storeUrl: '',
  buildRunUrl: '',
  publisherName: '',
  downloadCount: 0,
  downloadable: true,
  statusHistory: [],
};

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <ReleaseStatusForm
            release={RELEASE}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('ReleaseStatusForm', () => {
  it('requires a note', () => {
    mount();
    cy.contains('button', 'Change status').click();
    cy.contains('Say why the status is changing').should('be.visible');
  });

  it('only takes a full store address', () => {
    mount();
    cy.get('textarea[name="note"]').type('Submitted');
    cy.get('input[name="storeUrl"]').type('chromewebstore.google.com').blur();
    cy.contains('Enter the full store address, starting https://').should('be.visible');
    cy.get('input[name="storeUrl"]')
      .clear()
      .type('https://chromewebstore.google.com/detail/x')
      .blur();
    cy.contains('Enter the full store address').should('not.exist');
  });

  it('stays open when the server refuses', () => {
    mount();
    cy.get('textarea[name="note"]').type('Ship it');
    cy.contains('button', 'Change status').click();
    cy.get('@done').should('not.have.been.called');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
