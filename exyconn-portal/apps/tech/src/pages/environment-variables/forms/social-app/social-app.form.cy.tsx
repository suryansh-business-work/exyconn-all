import { MockedProvider } from '@apollo/client/testing/react';
import { type MockedResponse } from '@apollo/client/testing';
import { SaveSocialAppConfigDocument } from '@exyconn/shell/graphql/generated';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { SocialAppForm } from './social-app.form';
import type { SocialAppRow } from './social-app.types';

const blank: SocialAppRow = {
  __typename: 'SocialAppConfig',
  id: 'META',
  app: 'META' as SocialAppRow['app'],
  label: 'Facebook + Instagram',
  consoleUrl: 'https://developers.facebook.com/apps',
  callbackUrl: 'https://portal-server.exyconn.com/oauth/social/meta/callback',
  clientId: '',
  hasClientSecret: false,
  clientSecretHint: null,
  enabled: false,
};

/** A stored app: saving it untouched sends a blank secret, which the server reads as "keep". */
const stored: SocialAppRow = {
  ...blank,
  clientId: 'meta-client',
  hasClientSecret: true,
  clientSecretHint: '6789',
  enabled: true,
};
const keepSecret: MockedResponse = {
  request: {
    query: SaveSocialAppConfigDocument,
    variables: { input: { app: 'META', clientId: 'meta-client', clientSecret: '', enabled: true } },
  },
  result: { data: { saveSocialAppConfig: { ...stored } } },
};

const mount = (row: SocialAppRow, mocks: MockedResponse[] = []) =>
  cy.mount(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <SocialAppForm
            row={row}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('SocialAppForm', () => {
  it('shows the redirect URL to register', () => {
    mount(blank);
    cy.contains('https://portal-server.exyconn.com/oauth/social/meta/callback').should(
      'be.visible',
    );
    cy.contains('a', 'Open the console').should('have.attr', 'href', blank.consoleUrl);
  });

  it('needs both credentials to turn the app on', () => {
    mount(blank);
    cy.contains('label', 'Let Marketing connect accounts with this app').click();
    cy.contains('button', 'Save').click();
    cy.contains('Add the client ID before turning the app on').should('be.visible');
    cy.contains('Add the client secret before turning the app on').should('be.visible');
  });

  it('keeps the stored secret when it is left blank', () => {
    mount(stored, [keepSecret]);
    cy.contains('Leave blank to keep the current value').should('be.visible');
    cy.contains('button', 'Save').click();
    cy.get('@done').should('have.been.called');
  });
});
