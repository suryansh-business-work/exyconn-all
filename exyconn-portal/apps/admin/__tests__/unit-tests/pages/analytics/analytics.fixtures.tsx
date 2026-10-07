import { screen } from '@testing-library/react';
import type {
  PlatformAnalyticsQuery,
  WorkspaceAnalyticsQuery,
} from '@exyconn/shell/graphql/generated';

type Workspace = WorkspaceAnalyticsQuery['workspaceAnalytics'];
type Platform = PlatformAnalyticsQuery['platformAnalytics'];

export interface DrawnChartProps {
  data: { labels: string[]; datasets: { data: number[] }[] };
}

/** Chart.js needs a canvas jsdom lacks; the stand-in prints the labels it was asked to draw. */
export function DrawnChart({ data }: Readonly<DrawnChartProps>) {
  return <output data-testid="chart">{data.labels.join('|')}</output>;
}

/** Every label each chart on screen drew, in order. */
export const drawnLabels = () => screen.queryAllByTestId('chart').map((node) => node.textContent);

const metric = (label: string, value: number) => ({
  __typename: 'AnalyticsMetric' as const,
  label,
  value,
});
const point = (period: string, value: number) => ({
  __typename: 'AnalyticsPoint' as const,
  period,
  value,
});

export const workspace = (overrides: Partial<Workspace> = {}): Workspace => ({
  __typename: 'WorkspaceAnalytics',
  days: 30,
  timezone: 'UTC',
  users: {
    __typename: 'UserAnalytics',
    total: 12,
    active: 10,
    inactive: 1,
    blocked: 1,
    onlineNow: 3,
    joined: 2,
    byRole: [metric('EMPLOYEE', 9)],
    joinedPerDay: [point('2026-09-30', 2)],
  },
  employees: {
    __typename: 'EmployeeAnalytics',
    total: 9,
    byStatus: [metric('ACTIVE', 7), metric('ON_LEAVE', 2)],
    byDepartment: [metric('Engineering', 5), metric('Sales', 4)],
    byWorkLocation: [metric('Remote', 9)],
    byCountry: [metric('IN', 6), metric('Not set', 3)],
  },
  tracker: {
    __typename: 'TrackerAnalytics',
    usersWithAccess: 8,
    consented: 6,
    activeDevices: 5,
    screenshots: 40,
    sessions: 31,
    trackedUsers: 4,
    activeHours: 120.25,
    idleHours: 10,
    activityPercent: 82.4,
    hoursPerDay: [point('2026-09-30', 6.5)],
    topUsers: [metric('Asha', 40)],
    topApps: [metric('VS Code', 70)],
    devicesByPlatform: [metric('darwin', 3), metric('android', 2)],
    presence: [metric('ONLINE', 2)],
    manualEntriesByStatus: [metric('PENDING', 1)],
  },
  ...overrides,
});

export const platform = (overrides: Partial<Platform> = {}): Platform => ({
  __typename: 'PlatformAnalytics',
  organizations: 5,
  activeOrganizations: 4,
  users: 300,
  employees: 250,
  trackedUsers: 90,
  organizationsByStatus: [metric('ACTIVE', 4)],
  organizationsByCountry: [metric('IN', 3), metric('Not set', 2)],
  usersByOrganization: [metric('Acme', 120)],
  organizationsPerMonth: [point('2026-09', 2)],
  ...overrides,
});
