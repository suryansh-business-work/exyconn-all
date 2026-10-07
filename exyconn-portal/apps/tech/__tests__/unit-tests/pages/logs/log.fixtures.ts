import {
  AppLogLevel,
  AppLogSource,
  AppLogStatus,
  type AppLogEventFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import type { AppLogRow } from '../../../../src/pages/logs/logs-grid';

/** One grouped problem as the paged list returns it. */
export function logRow(overrides: Partial<AppLogRow> = {}): AppLogRow {
  return {
    id: 'grp-1',
    source: AppLogSource.Mobile,
    app: 'tracker-mobile',
    level: AppLogLevel.Error,
    errorName: 'TypeError',
    message: 'Cannot read properties of undefined',
    stack: 'TypeError: Cannot read properties of undefined\n    at Timer.tsx:12',
    route: '/timer',
    status: AppLogStatus.Open,
    count: 1200,
    userCount: 3,
    lastUserName: 'Asha Rao',
    lastUserEmail: 'asha@example.test',
    platform: 'android',
    appVersion: '1.9.7',
    firstSeenAt: '2026-10-01T09:00:00.000Z',
    lastSeenAt: '2026-10-07T09:00:00.000Z',
    resolvedAt: null,
    ...overrides,
  };
}

/** One stored occurrence of a problem. */
export function logEvent(
  overrides: Partial<AppLogEventFieldsFragment> = {},
): AppLogEventFieldsFragment {
  return {
    id: 'evt-1',
    level: AppLogLevel.Error,
    message: 'Cannot read properties of undefined (reading "id")',
    stack: 'at Timer.tsx:12',
    componentStack: 'at Timer\n  at App',
    route: '/timer',
    context: '{"taskId":"t-9"}',
    count: 4,
    occurredAt: '2026-10-07T09:00:00.000Z',
    createdAt: '2026-10-07T09:00:02.000Z',
    userId: 'u-1',
    userName: 'Asha Rao',
    userEmail: 'asha@example.test',
    userVerified: true,
    deviceId: 'dev-42',
    platform: 'android',
    osVersion: '14',
    deviceModel: 'Pixel 8',
    appVersion: '1.9.7',
    sessionId: 'sess-7',
    userAgent: 'ExyconnTracker/1.9.7',
    ip: '203.0.113.9',
    breadcrumbs: [
      { at: '2026-10-07T08:59:58.000Z', level: AppLogLevel.Info, message: 'Opened timer' },
      { at: '2026-10-07T08:59:59.000Z', level: AppLogLevel.Warn, message: 'Task list empty' },
    ],
    ...overrides,
  };
}

/** The viewer-settings formatter every log screen is given in tests. */
export const formatDateTime = (value: string | null | undefined) => `at ${value ?? ''}`;

/** `@exyconn/shell/hooks/useSettings` with a deterministic date-time formatter. */
export function settingsModule() {
  return { useSettings: () => ({ formatDateTime }) };
}
