import { describe, expect, it } from 'vitest';
import { AUDIT_COLUMNS } from '../../../../src/pages/audits/audits-grid';
import { auditRow } from '../compliance.fixtures';
import { formatCell, headersOf } from '../grid.helpers';

describe('AUDIT_COLUMNS', () => {
  it('lists the programme from what is audited to when and by whom', () => {
    expect(headersOf(AUDIT_COLUMNS)).toEqual([
      'Ref',
      'Audit',
      'Kind',
      'Scope',
      'Standards',
      'Lead auditor',
      'Auditee',
      'Planned',
      'Performed',
      'Status',
      '',
    ]);
  });

  it('names every standard the audit covers', () => {
    expect(formatCell(AUDIT_COLUMNS, 'standards', auditRow())).toBe('ISO 27001, ISO 9001');
    expect(formatCell(AUDIT_COLUMNS, 'standards', undefined)).toBe('');
  });

  it('formats the dates, with a dash for an audit not carried out yet', () => {
    const planned = '2026-10-01T00:00:00.000Z';
    expect(formatCell(AUDIT_COLUMNS, 'plannedOn', auditRow(), planned)).toBe(`on ${planned}`);
    expect(formatCell(AUDIT_COLUMNS, 'performedOn', auditRow(), null)).toBe('—');
  });
});
