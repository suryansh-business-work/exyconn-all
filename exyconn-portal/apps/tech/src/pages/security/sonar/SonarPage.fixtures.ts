import { SonarOverviewState } from '@exyconn/shell/graphql/generated';

/** Mock SonarQube answers for SonarPage.cy.tsx. */
export const HOST = 'https://sonar.example.test';

export const issue = (key: string, severity: string, message: string) => ({
  __typename: 'SonarIssue' as const,
  key,
  rule: 'typescript:S3358',
  severity,
  type: 'CODE_SMELL',
  file: 'src/app.ts',
  line: 12,
  message,
  url: `${HOST}/project/issues?id=exyconn&open=${key}`,
});

const facet = (value: string, count: number) => ({
  __typename: 'SonarFacetCount' as const,
  value,
  count,
});

const metrics = {
  __typename: 'SonarMetrics' as const,
  alertStatus: 'ERROR',
  bugs: 3,
  vulnerabilities: 0,
  securityHotspots: 2,
  codeSmells: 140,
  coverage: 72.5,
  duplicatedLinesDensity: 4.2,
  ncloc: 52000,
  reliabilityRating: 'C',
  securityRating: 'A',
  maintainabilityRating: 'A',
  technicalDebtMinutes: 600,
  newBugs: 1,
  newVulnerabilities: null,
  newSecurityHotspots: null,
  newCodeSmells: 4,
  newCoverage: 61.2,
  newDuplicatedLinesDensity: null,
};

export const overview = (state: SonarOverviewState, message = '') => ({
  sonarOverview: {
    __typename: 'SonarOverview' as const,
    state,
    message,
    configLabel: state === SonarOverviewState.NotConfigured ? '' : 'SonarCloud',
    projectKey: 'exyconn',
    projectUrl: `${HOST}/dashboard?id=exyconn`,
    checkedAt: '2026-10-04T08:00:00.000Z',
    qualityGate:
      state === SonarOverviewState.Ok
        ? {
            __typename: 'SonarQualityGate' as const,
            status: 'ERROR',
            conditions: [
              {
                __typename: 'SonarGateCondition' as const,
                status: 'ERROR',
                metric: 'new_coverage',
                comparator: 'LT',
                errorThreshold: '80',
                actualValue: '61.2',
              },
            ],
          }
        : null,
    metrics: state === SonarOverviewState.Ok ? metrics : null,
    analyses:
      state === SonarOverviewState.Ok
        ? [
            {
              __typename: 'SonarAnalysis' as const,
              key: 'A1',
              date: '2026-10-03T10:00:00.000Z',
              version: '1.9.7',
              events: ['Failed'],
            },
          ]
        : [],
    issues:
      state === SonarOverviewState.Ok ? [issue('I1', 'MAJOR', 'Extract this nested ternary')] : [],
    issuesTotal: state === SonarOverviewState.Ok ? 41 : 0,
    severityCounts:
      state === SonarOverviewState.Ok
        ? [facet('MAJOR', 30), facet('MINOR', 11), facet('INFO', 0)]
        : [],
    typeCounts: [],
  },
});
