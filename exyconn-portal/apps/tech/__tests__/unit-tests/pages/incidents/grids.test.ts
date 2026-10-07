import { describe, expect, it } from 'vitest';
import type { ColDef, ValueFormatterParams, ValueGetterParams } from 'ag-grid-community';
import type { RowActionSpec } from '@exyconn/crud';
import { INCIDENT_COLUMNS } from '../../../../src/pages/incidents/incidents-grid';
import { MAINTENANCE_COLUMNS } from '../../../../src/pages/incidents/maintenance-grid';
import {
  IMPACT_OPTIONS,
  INCIDENTS_PATH,
  UPDATE_STATUS_OPTIONS,
} from '../../../../src/pages/incidents/incidents.constants';
import * as incidentsModule from '../../../../src/pages/incidents';
import { incidentRow, maintenanceRow } from './incidents.fixtures';

/** What every grid puts on ag-grid's context: an English translator and the viewer's dates. */
const context = { t: (source: string) => source, formatDate: (value: string) => `on ${value}` };

function columnOf<T>(columns: readonly ColDef<T>[], key: string): ColDef<T> {
  const found = columns.find((column) => column.field === key || column.colId === key);
  if (!found) {
    throw new Error(`No column ${key}`);
  }
  return found;
}

function formatCell<T>(columns: readonly ColDef<T>[], key: string, data: T | undefined) {
  const formatter = columnOf(columns, key).valueFormatter as (
    params: ValueFormatterParams<T>,
  ) => string;
  return formatter({ data, value: undefined, context } as ValueFormatterParams<T>);
}

function getCell<T>(columns: readonly ColDef<T>[], key: string, data: T | undefined) {
  const getter = columnOf(columns, key).valueGetter as (params: ValueGetterParams<T>) => unknown;
  return getter({ data, context } as ValueGetterParams<T>);
}

function actionKeys<T>(columns: readonly ColDef<T>[]): string[] {
  const params = columnOf(columns, 'actions').cellRendererParams as {
    actionSpecs: readonly RowActionSpec[];
  };
  return params.actionSpecs.map((spec) => spec.key);
}

const headers = <T>(columns: readonly ColDef<T>[]) => columns.map((column) => column.headerName);

describe('INCIDENT_COLUMNS', () => {
  it('lays out the incident log, with posting an update before deleting', () => {
    expect(headers(INCIDENT_COLUMNS)).toEqual([
      'Incident',
      'Service',
      'Impact',
      'Source',
      'Progress',
      'Updates',
      'Started',
      'Resolved',
      '',
    ]);
    expect(actionKeys(INCIDENT_COLUMNS)).toEqual(['update', 'delete']);
  });

  it('calls an incident open until it has a resolution time', () => {
    expect(getCell(INCIDENT_COLUMNS, 'progress', incidentRow())).toBe('OPEN');
    expect(
      getCell(
        INCIDENT_COLUMNS,
        'progress',
        incidentRow({ resolvedAt: '2026-10-01T10:00:00.000Z' }),
      ),
    ).toBe('RESOLVED');
  });

  it('counts the updates posted on an incident', () => {
    expect(formatCell(INCIDENT_COLUMNS, 'updates', incidentRow())).toBe('1');
    expect(formatCell(INCIDENT_COLUMNS, 'updates', incidentRow({ updates: [] }))).toBe('0');
  });
});

describe('MAINTENANCE_COLUMNS', () => {
  it('lays out planned windows with the default edit and delete actions', () => {
    expect(headers(MAINTENANCE_COLUMNS)).toEqual([
      'Window',
      'Services',
      'Starts',
      'Ends',
      'Planned by',
      '',
    ]);
    expect(actionKeys(MAINTENANCE_COLUMNS)).toEqual(['edit', 'delete']);
  });

  it('lists the affected services in one cell', () => {
    expect(formatCell(MAINTENANCE_COLUMNS, 'affectedServiceKeys', maintenanceRow())).toBe(
      'api, web',
    );
  });
});

describe('incidents constants', () => {
  it('offers exactly the impacts and update statuses the server accepts', () => {
    expect(IMPACT_OPTIONS).toEqual([
      { value: 'CRITICAL', label: 'Critical' },
      { value: 'MAJOR', label: 'Major' },
      { value: 'MINOR', label: 'Minor' },
    ]);
    expect(UPDATE_STATUS_OPTIONS.map((option) => option.label)).toEqual([
      'Identified',
      'Investigating',
      'Monitoring',
      'Resolved',
    ]);
  });

  it('mounts the tabs under /tech/incidents and exports it with the page', () => {
    expect(INCIDENTS_PATH).toBe('/tech/incidents');
    expect(incidentsModule.INCIDENTS_PATH).toBe(INCIDENTS_PATH);
    expect(typeof incidentsModule.IncidentsPage).toBe('function');
  });
});
