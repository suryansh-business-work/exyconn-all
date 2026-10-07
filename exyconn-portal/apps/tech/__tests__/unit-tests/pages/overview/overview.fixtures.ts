import {
  StatusCategory,
  StatusState,
  type EmailDashboardQuery,
  type ListProblemReportsStatsQuery,
  type StatusOverviewQuery,
} from '@exyconn/shell/graphql/generated';

type Status = StatusOverviewQuery['statusOverview'];
type Service = Status['services'][number];
type Email = EmailDashboardQuery['emailDashboard'];
type Stats = ListProblemReportsStatsQuery['listProblemReportsStats'];

/** The nth monitored service, healthy unless told otherwise. */
export function service(index: number, overrides: Partial<Service> = {}): Service {
  return {
    id: `s-${index}`,
    key: `service-${index}`,
    name: `Service ${index}`,
    description: '',
    category: StatusCategory.Portal,
    url: `https://s${index}.example.test`,
    state: StatusState.Operational,
    responseMs: 120,
    lastCheckedAt: '2026-10-07T09:55:00.000Z',
    lastError: '',
    uptimeToday: 100,
    uptime30d: 99.5,
    days: [],
    ...overrides,
  };
}

/** Ten healthy services and their 30-day figures. */
export function status(overrides: Partial<Status> = {}): Status {
  return {
    state: StatusState.Operational,
    generatedAt: '2026-10-07T10:00:00.000Z',
    checkIntervalMinutes: 5,
    total: 10,
    operational: 10,
    degraded: 0,
    down: 0,
    uptimeToday: 100,
    uptime30d: 99.94,
    avgResponseMs: 140,
    services: Array.from({ length: 10 }, (_unused, index) => service(index)),
    daily: [
      { date: '2026-10-06', uptimePercent: 100, avgResponseMs: 130, checks: 288, failures: 0 },
      { date: '2026-10-07', uptimePercent: 99.5, avgResponseMs: 150, checks: 288, failures: 1 },
    ],
    incidents: [],
    maintenance: [],
    ...overrides,
  };
}

/** A week of outbound email. */
export function email(overrides: Partial<Email> = {}): Email {
  return {
    templates: 12,
    activeTemplates: 10,
    fragments: 4,
    sent: 42,
    failed: 0,
    configured: true,
    days: [
      { date: '2026-10-06', sent: 20, failed: 0 },
      { date: '2026-10-07', sent: 22, failed: 0 },
    ],
    byTemplate: [{ key: 'payslip', name: 'Payslip ready', sent: 30, failed: 0 }],
    recentFailures: [],
    ...overrides,
  };
}

/** Problem-report counts: one critical report, and as many new and in-progress ones as asked. */
export function problemStats({
  fresh = 1,
  inProgress = 1,
}: Readonly<{ fresh?: number; inProgress?: number }> = {}): Stats {
  return {
    total: 4,
    counts: [
      {
        field: 'status',
        buckets: [
          { value: 'NEW', count: fresh },
          { value: 'IN_PROGRESS', count: inProgress },
          { value: 'RESOLVED', count: 2 },
        ],
      },
      { field: 'severity', buckets: [{ value: 'CRITICAL', count: 1 }] },
    ],
    sums: [],
  };
}
