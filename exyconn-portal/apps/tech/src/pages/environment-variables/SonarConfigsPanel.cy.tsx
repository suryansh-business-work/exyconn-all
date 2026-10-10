import { MockedProvider } from '@apollo/client/testing/react';
import type { MockLink } from '@apollo/client/testing';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { ConfirmProvider } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { theme } from '@exyconn/shell/config/theme';
import {
  ListSonarConfigsDocument,
  TestSonarConnectionDocument,
} from '@exyconn/shell/graphql/generated';
import { SonarConfigsPanel } from './SonarConfigsPanel';

const config = (id: string, label: string) => ({
  __typename: 'SonarConfig' as const,
  id,
  label,
  hostUrl: 'https://sonarcloud.io',
  projectKey: `${id}_project`,
  organization: '',
  hasToken: true,
  tokenHint: 'wxyz',
  isActive: id === 'ok',
});

const LIST: MockLink.MockedResponse = {
  request: { query: ListSonarConfigsDocument },
  result: { data: { listSonarConfigs: [config('ok', 'SonarCloud'), config('bad', 'Old server')] } },
  maxUsageCount: 3,
};

const testResult = (id: string, ok: boolean, message: string): MockLink.MockedResponse => ({
  request: { query: TestSonarConnectionDocument, variables: { id } },
  result: {
    data: { testSonarConnection: { __typename: 'SonarConnectionTest', ok, message } },
  },
});

const mount = (mocks: MockLink.MockedResponse[]) => {
  cy.viewport(1280, 800);
  cy.mount(
    <MemoryRouter>
      <MockedProvider mocks={[LIST, ...mocks]}>
        <ThemeProvider theme={theme}>
          <NotificationProvider>
            <ConfirmProvider>
              <SonarConfigsPanel />
            </ConfirmProvider>
          </NotificationProvider>
        </ThemeProvider>
      </MockedProvider>
    </MemoryRouter>,
  );
};

describe('SonarConfigsPanel', () => {
  it('lists configs with the token masked', () => {
    mount([]);
    cy.contains('tr', 'SonarCloud').should('contain', '••••wxyz').and('contain', 'ok_project');
  });

  it('says the connection works when SonarQube found the project', () => {
    mount([testResult('ok', true, 'Connected to SonarQube and found the project Exyconn.')]);
    cy.contains('tr', 'SonarCloud').find('button[aria-label="test sonarqube connection"]').click();
    cy.contains('Connected to SonarQube and found the project Exyconn.').should('be.visible');
  });

  it('says why the connection failed', () => {
    mount([testResult('bad', false, 'SonarQube did not accept the token.')]);
    cy.contains('tr', 'Old server').find('button[aria-label="test sonarqube connection"]').click();
    cy.contains('SonarQube did not accept the token.').should('be.visible');
  });

  it('reports a test that could not run', () => {
    mount([
      {
        request: { query: TestSonarConnectionDocument, variables: { id: 'ok' } },
        error: new Error('SonarQube config not found'),
      },
    ]);
    cy.contains('tr', 'SonarCloud').find('button[aria-label="test sonarqube connection"]').click();
    cy.contains('SonarQube config not found').should('be.visible');
  });

  it('opens the form to add a config', () => {
    mount([]);
    cy.contains('button', 'New SonarQube config').click();
    cy.get('input[name="projectKey"]').should('be.visible');
  });
});
