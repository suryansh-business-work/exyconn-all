import type { SonarOverviewQuery } from '@exyconn/shell/graphql/generated';

export type SonarOverviewData = SonarOverviewQuery['sonarOverview'];
export type SonarMetricsData = NonNullable<SonarOverviewData['metrics']>;
export type SonarIssueRow = SonarOverviewData['issues'][number] & { id: string };
export type SonarAnalysisRow = SonarOverviewData['analyses'][number];

export type ChipColor = 'success' | 'warning' | 'error' | 'info' | 'default';

/** Where the SonarQube credential is set up. */
export const SONAR_SETTINGS_PATH = '/tech/environment-variables/sonarqube';

/** A–E rating -> chip colour; SonarQube's own scale runs green to red. */
export const RATING_COLOR: Record<string, ChipColor> = {
  A: 'success',
  B: 'success',
  C: 'warning',
  D: 'error',
  E: 'error',
};

/** Issue severity -> chip colour, worst first. */
export const SEVERITY_COLOR: Record<string, ChipColor> = {
  BLOCKER: 'error',
  CRITICAL: 'error',
  MAJOR: 'warning',
  MINOR: 'info',
  INFO: 'default',
};

/** Quality-gate status -> the alert it is shown as. */
export const GATE_SEVERITY: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  OK: 'success',
  WARN: 'warning',
  ERROR: 'error',
  NONE: 'info',
};

/** A metric key as words: `new_coverage` -> `new coverage`. */
export function metricLabel(metric: string): string {
  return metric.replaceAll('_', ' ');
}
