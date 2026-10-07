import {
  IncidentImpact,
  IncidentSource,
  IncidentUpdateStatus,
  StatusState,
  type ListStatusMonitorsQuery,
} from '@exyconn/shell/graphql/generated';
import type { PagedIncidentRow } from '../../../../src/pages/incidents/incidents-grid';
import type { PagedMaintenanceRow } from '../../../../src/pages/incidents/maintenance-grid';

/** An open incident the monitor raised, with one update posted so far. */
export function incidentRow(overrides: Partial<PagedIncidentRow> = {}): PagedIncidentRow {
  return {
    id: 'inc-1',
    serviceKey: 'api',
    serviceName: 'Portal API',
    title: 'Portal API is slow',
    source: IncidentSource.Monitor,
    impact: IncidentImpact.Major,
    affectedServiceKeys: ['api'],
    state: StatusState.Down,
    reason: 'Timeouts',
    startedAt: '2026-10-01T09:00:00.000Z',
    resolvedAt: null,
    durationMinutes: 12,
    updates: [
      {
        id: 'upd-1',
        status: IncidentUpdateStatus.Investigating,
        body: 'We are looking into slow responses',
        authorName: 'Monitor',
        createdAt: '2026-10-01T09:01:00.000Z',
      },
    ],
    ...overrides,
  };
}

/** A planned window over two services. */
export function maintenanceRow(overrides: Partial<PagedMaintenanceRow> = {}): PagedMaintenanceRow {
  return {
    id: 'mw-1',
    title: 'Database upgrade',
    body: 'Mongo moves to the new cluster',
    affectedServiceKeys: ['api', 'web'],
    startsAt: '2026-11-01T10:00:00.000Z',
    endsAt: '2026-11-01T12:00:00.000Z',
    createdBy: 'Ravi',
    createdAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}

/** The monitors the status page probes, offered as affected services. */
export const MONITORS: ListStatusMonitorsQuery = {
  listStatusMonitors: [
    { id: 'm1', key: 'api', name: 'Portal API' },
    { id: 'm2', key: 'web', name: 'Website' },
  ],
};
