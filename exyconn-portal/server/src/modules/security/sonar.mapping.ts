import { baseUrl } from './sonar.client';

/**
 * SonarQube Web API payloads -> the shapes the SonarQube screen renders. Pure, so the mapping
 * is tested without a server. Only the fields read are typed; the API returns many more.
 */

/** Metric key -> field on SonarMetrics. The order is the order the API is asked for them. */
const METRIC_FIELDS = {
  alert_status: 'alertStatus',
  bugs: 'bugs',
  vulnerabilities: 'vulnerabilities',
  security_hotspots: 'securityHotspots',
  code_smells: 'codeSmells',
  coverage: 'coverage',
  duplicated_lines_density: 'duplicatedLinesDensity',
  ncloc: 'ncloc',
  reliability_rating: 'reliabilityRating',
  security_rating: 'securityRating',
  sqale_rating: 'maintainabilityRating',
  sqale_index: 'technicalDebtMinutes',
  new_bugs: 'newBugs',
  new_vulnerabilities: 'newVulnerabilities',
  new_security_hotspots: 'newSecurityHotspots',
  new_code_smells: 'newCodeSmells',
  new_coverage: 'newCoverage',
  new_duplicated_lines_density: 'newDuplicatedLinesDensity',
} as const;

/** The `metricKeys` parameter for /api/measures/component. */
export const METRIC_KEYS = Object.keys(METRIC_FIELDS).join(',');

const RATING_FIELDS = new Set(['reliabilityRating', 'securityRating', 'maintainabilityRating']);
const RATING_LETTERS = ['A', 'B', 'C', 'D', 'E'];

type MetricField = (typeof METRIC_FIELDS)[keyof typeof METRIC_FIELDS];
export type SonarMetrics = Record<MetricField, number | string | null>;

interface MeasurePayload {
  metric: string;
  value?: string;
  period?: { value?: string };
  periods?: { value?: string }[];
}

export interface MeasuresPayload {
  component?: { measures?: MeasurePayload[] };
}

export interface QualityGatePayload {
  projectStatus?: {
    status?: string;
    conditions?: {
      status?: string;
      metricKey?: string;
      comparator?: string;
      errorThreshold?: string;
      actualValue?: string;
    }[];
  };
}

export interface AnalysesPayload {
  analyses?: {
    key: string;
    date: string;
    projectVersion?: string;
    events?: { category?: string; name?: string }[];
  }[];
}

interface FacetPayload {
  property: string;
  values?: { val: string; count: number }[];
}

export interface IssuesPayload {
  total?: number;
  issues?: {
    key: string;
    rule?: string;
    severity?: string;
    type?: string;
    component?: string;
    line?: number;
    message?: string;
  }[];
  facets?: FacetPayload[];
}

/** "1.0".."5.0" -> "A".."E"; null for anything else. */
export function ratingLetter(value: string | undefined): string | null {
  const index = Number(value) - 1;
  return RATING_LETTERS[index] ?? null;
}

/** A measure's value: new-code metrics carry it in `period`/`periods` on older servers. */
function measureValue(measure: MeasurePayload): string | undefined {
  return measure.value ?? measure.period?.value ?? measure.periods?.[0]?.value;
}

/** Every metric the screen shows; one the server does not compute is null. */
export function mapMetrics(payload: MeasuresPayload): SonarMetrics {
  const values = new Map(
    (payload.component?.measures ?? []).map((measure) => [measure.metric, measureValue(measure)]),
  );
  const metrics = {} as SonarMetrics;
  for (const [metric, field] of Object.entries(METRIC_FIELDS)) {
    const raw = values.get(metric);
    if (RATING_FIELDS.has(field)) {
      metrics[field] = ratingLetter(raw);
    } else if (field === 'alertStatus') {
      metrics[field] = raw ?? null;
    } else {
      const number = Number(raw);
      metrics[field] = raw === undefined || Number.isNaN(number) ? null : number;
    }
  }
  return metrics;
}

export function mapQualityGate(payload: QualityGatePayload) {
  const status = payload.projectStatus;
  return {
    status: status?.status ?? 'NONE',
    conditions: (status?.conditions ?? []).map((condition) => ({
      status: condition.status ?? '',
      metric: condition.metricKey ?? '',
      comparator: condition.comparator ?? '',
      errorThreshold: condition.errorThreshold ?? '',
      actualValue: condition.actualValue ?? '',
    })),
  };
}

export function mapAnalyses(payload: AnalysesPayload) {
  return (payload.analyses ?? []).map((analysis) => ({
    key: analysis.key,
    date: new Date(analysis.date),
    version: analysis.projectVersion ?? '',
    events: (analysis.events ?? []).map((event) => event.name ?? '').filter((name) => name !== ''),
  }));
}

/** The counts one facet (severities, types) reports. */
export function facetCounts(payload: IssuesPayload, property: string) {
  const facet = payload.facets?.find((candidate) => candidate.property === property);
  return (facet?.values ?? []).map(({ val, count }) => ({ value: val, count }));
}

/** "project:src/app.ts" -> "src/app.ts"; the project itself has no file. */
export function issueFile(component: string | undefined, projectKey: string): string {
  if (!component) {
    return '';
  }
  const prefix = `${projectKey}:`;
  return component.startsWith(prefix) ? component.slice(prefix.length) : component;
}

/** Where the project's dashboard lives on the SonarQube server. */
export function projectUrl(hostUrl: string, projectKey: string): string {
  return `${baseUrl(hostUrl)}/dashboard?id=${encodeURIComponent(projectKey)}`;
}

/** Where one issue opens on the SonarQube server. */
export function issueUrl(hostUrl: string, projectKey: string, issueKey: string): string {
  const query = new URLSearchParams({ id: projectKey, open: issueKey });
  return `${baseUrl(hostUrl)}/project/issues?${query.toString()}`;
}

export function mapIssues(payload: IssuesPayload, hostUrl: string, projectKey: string) {
  return (payload.issues ?? []).map((issue) => ({
    key: issue.key,
    rule: issue.rule ?? '',
    severity: issue.severity ?? '',
    type: issue.type ?? '',
    file: issueFile(issue.component, projectKey),
    line: issue.line ?? null,
    message: issue.message ?? '',
    url: issueUrl(hostUrl, projectKey, issue.key),
  }));
}
