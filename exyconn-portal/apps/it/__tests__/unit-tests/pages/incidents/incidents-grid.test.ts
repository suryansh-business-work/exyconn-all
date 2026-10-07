import { describe, expect, it } from 'vitest';
import { INCIDENT_COLUMNS } from '../../../../src/pages/incidents/incidents-grid';
import { incidentRow } from '../../core/rows.fixtures';
import { actionKeys, formatCell, headersOf } from '../../core/grid.helpers';

describe('INCIDENT_COLUMNS', () => {
  it('reads the incident, severity, category, status, when it started and ended', () => {
    expect(headersOf(INCIDENT_COLUMNS)).toEqual([
      'Incident',
      'Severity',
      'Category',
      'Status',
      'Started',
      'Resolved',
      'Actions open',
      '',
    ]);
    expect(actionKeys(INCIDENT_COLUMNS)).toEqual(['timeline', 'edit', 'delete']);
  });

  it('dashes an incident that is not resolved yet', () => {
    expect(formatCell(INCIDENT_COLUMNS, 'resolvedAt', incidentRow(), null)).toBe('—');
    expect(formatCell(INCIDENT_COLUMNS, 'startedAt', incidentRow(), '2026-10-05')).toBe(
      'on 2026-10-05',
    );
  });

  it('counts only the follow-up actions not yet done', () => {
    expect(formatCell(INCIDENT_COLUMNS, 'followUps', incidentRow())).toBe('1');
    expect(formatCell(INCIDENT_COLUMNS, 'followUps', incidentRow({ followUps: [] }))).toBe('0');
  });
});
