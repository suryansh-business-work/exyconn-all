import { describe, expect, it } from 'vitest';
import type { ValueFormatterParams } from 'ag-grid-community';
import type { AuditLogRow } from '@exyconn/shell/components/audit';
import { AuditAction } from '@exyconn/shell/graphql/generated';
import { AUDIT_COLUMNS } from '../../src/grid/auditColumns';

const row: AuditLogRow = {
  id: 'a1',
  actorId: 'u1',
  actorName: 'Asha',
  actorEmail: 'asha@exyconn.com',
  action: AuditAction.Update,
  module: 'Invoice',
  entityId: 'i1',
  entityLabel: 'INV-001',
  summary: 'Updated Invoice',
  changes: '',
  ip: '',
  createdAt: '2026-09-01T10:00:00.000Z',
};

const context = { t: (source: string) => source, formatDateTime: (value: string) => `at ${value}` };

const format = (field: string, data: AuditLogRow | undefined) => {
  const column = AUDIT_COLUMNS.find((col) => col.field === field);
  const formatter = column?.valueFormatter as (p: ValueFormatterParams<AuditLogRow>) => string;
  return formatter({ data, context } as unknown as ValueFormatterParams<AuditLogRow>);
};

describe('AUDIT_COLUMNS', () => {
  it('shows when through the viewer’s date-time format, and nothing while loading', () => {
    expect(format('createdAt', row)).toBe('at 2026-09-01T10:00:00.000Z');
    expect(format('createdAt', undefined)).toBe('');
  });

  it('names the actor, or their email when the name is blank', () => {
    expect(format('actorName', row)).toBe('Asha');
    expect(format('actorName', { ...row, actorName: '' })).toBe('asha@exyconn.com');
  });

  it('offers the module, entity and summary as columns', () => {
    expect(AUDIT_COLUMNS.map((col) => col.field)).toEqual(
      expect.arrayContaining(['action', 'module', 'entityLabel', 'summary']),
    );
  });
});
