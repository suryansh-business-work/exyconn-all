import type { MockLink } from '@apollo/client/testing';
import {
  IncidentImpact,
  IncidentSource,
  IncidentUpdateStatus,
  StatusCategory,
  StatusOverviewDocument,
  StatusState,
} from '@exyconn/shell/graphql/generated';
import type {
  StatusDay,
  StatusIncident,
  StatusIncidentUpdate,
  StatusMaintenance,
  StatusOverview,
  StatusService,
} from '../../../../src/pages/status';

/** One day of checks; uptime follows from the checks and failures, as the API computes it. */
export const dayPoint = (
  date: string,
  checks: number,
  failures = 0,
  avgResponseMs = 180,
): StatusDay => ({
  __typename: 'StatusDayPoint',
  date,
  uptimePercent: checks === 0 ? 0 : ((checks - failures) / checks) * 100,
  avgResponseMs,
  checks,
  failures,
});

export const service = (overrides: Partial<StatusService> = {}): StatusService => ({
  __typename: 'StatusServiceSummary',
  id: 'svc-website',
  key: 'website',
  name: 'Website',
  description: 'The public site',
  category: StatusCategory.Website,
  url: 'https://exyconn.com',
  state: StatusState.Operational,
  responseMs: 120,
  lastCheckedAt: '2026-09-03T08:59:00.000Z',
  lastError: '',
  uptimeToday: 100,
  uptime30d: 100,
  days: [dayPoint('2026-09-02', 288), dayPoint('2026-09-03', 100)],
  ...overrides,
});

export const hrPortal = (overrides: Partial<StatusService> = {}): StatusService =>
  service({
    id: 'svc-hr',
    key: 'hr',
    name: 'HR Portal',
    description: 'People, leave and payroll',
    category: StatusCategory.Portal,
    url: 'https://hr.exyconn.com',
    state: StatusState.Degraded,
    responseMs: 2400,
    uptime30d: 99.8,
    ...overrides,
  });

export const incidentUpdate = (
  overrides: Partial<StatusIncidentUpdate> = {},
): StatusIncidentUpdate => ({
  __typename: 'StatusIncidentUpdate',
  id: 'upd-1',
  status: IncidentUpdateStatus.Resolved,
  body: 'HTTP 502 cleared',
  authorName: 'Monitor',
  createdAt: '2026-09-02T04:20:00.000Z',
  ...overrides,
});

export const incident = (overrides: Partial<StatusIncident> = {}): StatusIncident => ({
  __typename: 'StatusIncident',
  id: 'inc-1',
  serviceKey: 'hr',
  serviceName: 'HR Portal',
  title: 'HR Portal is down',
  source: IncidentSource.Monitor,
  impact: IncidentImpact.Major,
  affectedServiceKeys: ['hr'],
  state: StatusState.Down,
  reason: 'HTTP 502',
  updates: [incidentUpdate()],
  startedAt: '2026-09-02T04:00:00.000Z',
  resolvedAt: '2026-09-02T04:20:00.000Z',
  durationMinutes: 20,
  ...overrides,
});

export const maintenanceWindow = (
  overrides: Partial<StatusMaintenance> = {},
): StatusMaintenance => ({
  __typename: 'StatusMaintenance',
  id: 'mnt-1',
  title: 'Database upgrade',
  body: '',
  affectedServiceKeys: [],
  startsAt: '2026-09-04T01:00:00.000Z',
  endsAt: '2026-09-04T02:00:00.000Z',
  inProgress: false,
  ...overrides,
});

export const overview = (overrides: Partial<StatusOverview> = {}): StatusOverview => ({
  __typename: 'StatusOverview',
  state: StatusState.Operational,
  generatedAt: '2026-09-03T09:00:00.000Z',
  checkIntervalMinutes: 5,
  total: 2,
  operational: 1,
  degraded: 1,
  down: 0,
  uptimeToday: 99.5,
  uptime30d: 99.9,
  avgResponseMs: 180,
  services: [service(), hrPortal()],
  daily: [dayPoint('2026-09-02', 576, 2), dayPoint('2026-09-03', 200, 1)],
  incidents: [],
  maintenance: [],
  ...overrides,
});

/** The overview query as the page asks for it, answered with `value`. */
export const overviewMock = (days: number, value: StatusOverview): MockLink.MockedResponse => ({
  request: { query: StatusOverviewDocument, variables: { days } },
  result: { data: { statusOverview: value } },
});
