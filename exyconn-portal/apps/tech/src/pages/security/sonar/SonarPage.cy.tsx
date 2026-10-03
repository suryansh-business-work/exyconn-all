import { MockedProvider } from '@apollo/client/testing/react';
import type { MockedResponse } from '@apollo/client/testing';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import {
  SonarIssuesDocument,
  SonarOverviewDocument,
  SonarOverviewState,
} from '@exyconn/shell/graphql/generated';
import { SonarPage } from './SonarPage';
import { HOST, issue, overview } from './SonarPage.fixtures';

const overviewMock = (data: object, variables: Record<string, unknown> = {}): MockedResponse => ({
  request: { query: SonarOverviewDocument, variables },
  result: { data },
});

const mount = (mocks: MockedResponse[]) => {
  cy.viewport(1280, 1000);
  cy.mount(
    <MemoryRouter initialEntries={['/tech/security/sonar']}>
      <MockedProvider mocks={mocks}>
        <ThemeProvider theme={theme}>
          <NotificationProvider>
            <Routes>
              <Route path="/tech/security/sonar" element={<SonarPage />} />
              <Route
                path="/tech/environment-variables/sonarqube"
                element={<p>SonarQube settings screen</p>}
              />
            </Routes>
          </NotificationProvider>
        </ThemeProvider>
      </MockedProvider>
    </MemoryRouter>,
  );
};

describe('SonarPage', () => {
  it('shows the failed gate, the measures, analyses and issues with links to SonarQube', () => {
    mount([overviewMock(overview(SonarOverviewState.Ok))]);
    cy.contains('Quality gate failed').should('be.visible');
    cy.contains('new coverage is 61.2 (must be at least 80)').should('be.visible');
    cy.contains('Bugs').parent().parent().should('contain', '3');
    cy.get('[aria-label="Reliability rating C"]').should('contain', 'C');
    cy.contains('10 h of technical debt').should('be.visible');
    cy.get('[role="progressbar"][aria-label="Coverage"]').should('exist');
    cy.contains('1.9.7').should('be.visible');
    cy.contains('Open issues (41)').should('be.visible');
    cy.contains('tr', 'Extract this nested ternary')
      .find('a')
      .should('have.attr', 'href', `${HOST}/project/issues?id=exyconn&open=I1`)
      .and('have.attr', 'target', '_blank');
    cy.contains('a', 'Open in SonarQube').should(
      'have.attr',
      'href',
      `${HOST}/dashboard?id=exyconn`,
    );
    cy.contains('button', 'INFO').should('not.exist');
  });

  it('asks SonarQube for one severity when the filter changes', () => {
    mount([
      overviewMock(overview(SonarOverviewState.Ok)),
      {
        request: { query: SonarIssuesDocument, variables: { severity: 'MINOR' } },
        result: { data: { sonarIssues: [issue('I9', 'MINOR', 'Remove this unused import')] } },
      },
    ]);
    cy.contains('button', 'MINOR (11)').click();
    cy.contains('tr', 'Remove this unused import').should('be.visible');
    cy.contains('Extract this nested ternary').should('not.exist');
    cy.contains('button', 'All').click();
    cy.contains('tr', 'Extract this nested ternary').should('be.visible');
  });

  it('reads SonarQube again on Refresh', () => {
    const passed = overview(SonarOverviewState.Ok);
    passed.sonarOverview.qualityGate = {
      __typename: 'SonarQualityGate',
      status: 'OK',
      conditions: [],
    };
    mount([overviewMock(overview(SonarOverviewState.Ok)), overviewMock(passed, { refresh: true })]);
    cy.contains('Quality gate failed').should('be.visible');
    cy.contains('button', 'Refresh').click();
    cy.contains('Quality gate passed').should('be.visible');
  });

  it('invites setting SonarQube up when nothing is configured', () => {
    mount([
      overviewMock(
        overview(SonarOverviewState.NotConfigured, 'No SonarQube project is set up yet.'),
      ),
    ]);
    cy.contains('SonarQube is not set up').should('be.visible');
    cy.contains('button', 'Set up SonarQube').click();
    cy.contains('SonarQube settings screen').should('be.visible');
  });

  it('explains a refused token and links to the settings', () => {
    mount([
      overviewMock(
        overview(SonarOverviewState.Unauthorized, 'SonarQube did not accept the token.'),
      ),
    ]);
    cy.contains('SonarQube did not accept the token.').should('be.visible');
    cy.contains('button', 'Check settings').click();
    cy.contains('SonarQube settings screen').should('be.visible');
  });
});
