import {
  PayType,
  TrackerManualEntryStatus,
  TrackerMessageDirection,
  TrackerMessageKind,
  type TrackerBillingQuery,
  type TrackerManualEntryFieldsFragment,
  type TrackerMessageFieldsFragment,
  type TrackerMessageThreadsQuery,
} from '@exyconn/shell/graphql/generated';
import type {
  TrackerAccessRow,
  TrackerDeviceRow,
  TrackerSettingsRow,
} from '@exyconn/shell/pages/tracker-view/tracker.types';
import type { ProjectBillingRow } from '../../../../src/pages/tracker/tracker.billing';

/** What a query hook hands back, with only the fields the tracker pages read. */
export function queryResult<T>(data: T | undefined, loading = false, extra: object = {}) {
  return { data, loading, refetch: () => Promise.resolve({ data }), ...extra };
}

/** An instant `msAgo` milliseconds before now, as the API sends it. */
export const isoAgo = (msAgo: number) => new Date(Date.now() - msAgo).toISOString();

export function employeeOption(id: string, name: string) {
  return { __typename: 'EmployeeOption' as const, id, name, email: `${id}@example.test` };
}

export function accessRow(overrides: Partial<TrackerAccessRow> = {}): TrackerAccessRow {
  return {
    id: 'access-1',
    userId: 'u1',
    grantedBy: 'admin',
    grantedAt: '2026-01-10T09:00:00.000Z',
    revokedAt: null,
    isActive: true,
    consentedAt: null,
    timezone: '',
    ...overrides,
  };
}

export function deviceRow(overrides: Partial<TrackerDeviceRow> = {}): TrackerDeviceRow {
  return {
    id: 'device-row-1',
    userId: 'u1',
    deviceId: 'dev-1',
    platform: 'darwin',
    hostname: 'asha-mbp',
    appVersion: '1.9.7',
    machineId: 'machine-1',
    osName: 'macOS',
    osVersion: '15.1',
    arch: 'arm64',
    cpuModel: 'Apple M3',
    cpuCores: 8,
    totalMemoryMb: 16384,
    locale: 'en-IN',
    timezone: 'Asia/Kolkata',
    screenCount: 2,
    screenResolution: '3024x1964',
    issuedAt: '2026-01-01T08:00:00.000Z',
    lastSeenAt: '2026-01-15T10:00:00.000Z',
    revokedAt: null,
    isActive: true,
    ...overrides,
  };
}

export function settingsRow(overrides: Partial<TrackerSettingsRow> = {}): TrackerSettingsRow {
  return {
    id: 'settings-1',
    intervalMinutes: 10,
    screenshotsPerInterval: 1,
    idleThresholdSeconds: 300,
    idleAutoPauseMinutes: 15,
    screenshotMaxWidth: 1280,
    screenshotQuality: 60,
    screenshotRetentionDays: 0,
    autoStartEnabled: false,
    autoStartHour: 9,
    autoStopHour: 18,
    dailyDigestEnabled: false,
    weeklyDigestEnabled: false,
    digestHour: 9,
    randomizeScreenshotTiming: true,
    blurScreenshots: false,
    trackWindowTitles: true,
    captureSoundEnabled: true,
    webcamEnabled: false,
    webcamCorner: 'bottom-right',
    syncIntervalMinutes: 5,
    consentText: '<p>We track activity during work hours.</p>',
    consentPolicySlug: '',
    defaultTimezone: 'Asia/Kolkata',
    ...overrides,
  };
}

type BillingRow = TrackerBillingQuery['trackerBilling']['rows'][number];

export function billingRow(overrides: Partial<BillingRow> = {}): BillingRow {
  return {
    id: 'emp-1',
    name: 'Asha Rao',
    email: 'asha@example.test',
    payType: PayType.Hourly,
    currency: 'USD',
    billingRate: 40,
    hours: 12.5,
    amount: 500,
    rated: true,
    ...overrides,
  };
}

export function projectRow(overrides: Partial<ProjectBillingRow> = {}): ProjectBillingRow {
  return {
    projectId: 'p1',
    projectName: 'Website rebuild',
    clientId: 'c1',
    clientName: 'Acme',
    currency: 'USD',
    hours: 30,
    amount: 1200,
    budgetHours: 100,
    budgetAmount: 5000,
    employees: [
      { employeeId: 'e1', employeeName: 'Asha Rao', hours: 20, rate: 40, amount: 800 },
      { employeeId: 'e2', employeeName: 'Dev Mehta', hours: 10, rate: 40, amount: 400 },
    ],
    ...overrides,
  };
}

export function manualEntry(
  overrides: Partial<TrackerManualEntryFieldsFragment> = {},
): TrackerManualEntryFieldsFragment {
  return {
    id: 'entry-1',
    userId: 'u1',
    userName: 'Asha Rao',
    projectId: 'p1',
    projectName: 'Website rebuild',
    startedAt: '2026-01-15T09:00:00.000Z',
    endedAt: '2026-01-15T10:30:00.000Z',
    durationMs: 90 * 60_000,
    note: 'Client workshop',
    status: TrackerManualEntryStatus.Pending,
    reviewedAt: null,
    reviewNote: '',
    createdAt: '2026-01-15T11:00:00.000Z',
    ...overrides,
  };
}

type Thread = TrackerMessageThreadsQuery['trackerMessageThreads'][number];

export function thread(overrides: Partial<Thread> = {}): Thread {
  return {
    userId: 'u1',
    userName: 'Asha Rao',
    userEmail: 'asha@example.test',
    lastMessageAt: '2026-01-15T10:00:00.000Z',
    lastMessageBody: 'Is Friday a holiday?',
    unread: 2,
    ...overrides,
  };
}

export function message(
  overrides: Partial<TrackerMessageFieldsFragment> = {},
): TrackerMessageFieldsFragment {
  return {
    id: 'm1',
    userId: 'u1',
    kind: TrackerMessageKind.Chat,
    direction: TrackerMessageDirection.ToAdmin,
    title: '',
    body: 'Is Friday a holiday?',
    authorName: '',
    readAt: null,
    createdAt: '2026-01-15T10:00:00.000Z',
    ...overrides,
  };
}
