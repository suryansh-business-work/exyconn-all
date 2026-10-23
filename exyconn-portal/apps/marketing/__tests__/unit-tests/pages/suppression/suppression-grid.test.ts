import { describe, expect, it } from 'vitest';
import type { ValueGetterParams } from 'ag-grid-community';
import { AudienceRecordKind } from '@exyconn/shell/graphql/generated';
import {
  SUPPRESSION_COLUMNS,
  type PagedSuppressionRow,
} from '../../../../src/pages/suppression/suppression-grid';
import { actionSpecs, columnIds, formatCell, isActionHidden } from '../../grid-helpers';
import { suppressionRow } from '../../fixtures';

const row = (overrides: Partial<PagedSuppressionRow> = {}): PagedSuppressionRow => ({
  ...suppressionRow(),
  linkedRecords: [],
  ...overrides,
});

/** The status chip value the derived Status column hands its cell. */
const statusOf = (target: PagedSuppressionRow | undefined) => {
  const column = SUPPRESSION_COLUMNS.find((c) => c.colId === 'status');
  const getter = column?.valueGetter as (params: ValueGetterParams<PagedSuppressionRow>) => unknown;
  return getter({ data: target, context: {} } as ValueGetterParams<PagedSuppressionRow>);
};

describe('SUPPRESSION_COLUMNS', () => {
  it('lists the suppression columns, with the actions last', () => {
    expect(columnIds(SUPPRESSION_COLUMNS)).toEqual([
      'email',
      'reason',
      'origin',
      'linkedRecords',
      'scope',
      'status',
      'createdAt',
      'addedByName',
      'note',
      'actions',
    ]);
  });

  it('names every CRM record holding the address, or a dash when none does', () => {
    const linked = row({
      linkedRecords: [
        { kind: AudienceRecordKind.Contact, id: 'c1', name: 'Priya Shah', emails: [] },
        { kind: AudienceRecordKind.Company, id: 'co1', name: 'Urban Café', emails: [] },
      ],
    });
    expect(formatCell(SUPPRESSION_COLUMNS, 'linkedRecords', linked)).toBe(
      'Priya Shah (contact), Urban Café (company)',
    );
    expect(formatCell(SUPPRESSION_COLUMNS, 'linkedRecords', row())).toBe('—');
    expect(formatCell(SUPPRESSION_COLUMNS, 'linkedRecords', row({ linkedRecords: null }))).toBe(
      '—',
    );
  });

  it('shows who added the address and the note, or a dash', () => {
    expect(formatCell(SUPPRESSION_COLUMNS, 'addedByName', row({ addedByName: 'Asha' }))).toBe(
      'Asha',
    );
    expect(formatCell(SUPPRESSION_COLUMNS, 'addedByName', row())).toBe('—');
    expect(formatCell(SUPPRESSION_COLUMNS, 'note', row({ note: 'Asked by phone' }))).toBe(
      'Asked by phone',
    );
    expect(formatCell(SUPPRESSION_COLUMNS, 'note', row())).toBe('—');
  });

  it('writes nothing while the row is still loading', () => {
    expect(formatCell(SUPPRESSION_COLUMNS, 'note', undefined)).toBe('');
    expect(statusOf(undefined)).toBeNull();
  });

  it('marks archived rows, which stay suppressed', () => {
    expect(statusOf(row())).toBe('ACTIVE');
    expect(statusOf(row({ archivedAt: '2026-10-01T00:00:00.000Z' }))).toBe('ARCHIVED');
  });

  it('dates each row through the viewer settings', () => {
    const target = row();
    expect(
      formatCell(SUPPRESSION_COLUMNS, 'createdAt', target, {
        value: target.createdAt,
        context: { formatDate: (value: string) => `on ${value}` },
      }),
    ).toBe(`on ${target.createdAt}`);
  });

  it('offers details, note, archive or unarchive, and a justified removal — never edit', () => {
    expect(actionSpecs(SUPPRESSION_COLUMNS).map((spec) => spec.key)).toEqual([
      'details',
      'note',
      'archive',
      'unarchive',
      'remove',
    ]);
    const active = row();
    const archived = row({ archivedAt: '2026-10-01T00:00:00.000Z' });
    expect(isActionHidden(SUPPRESSION_COLUMNS, 'archive', active)).toBe(false);
    expect(isActionHidden(SUPPRESSION_COLUMNS, 'unarchive', active)).toBe(true);
    expect(isActionHidden(SUPPRESSION_COLUMNS, 'archive', archived)).toBe(true);
    expect(isActionHidden(SUPPRESSION_COLUMNS, 'unarchive', archived)).toBe(false);
    expect(isActionHidden(SUPPRESSION_COLUMNS, 'remove', archived)).toBe(false);
  });
});

describe('SUPPRESSION_COLUMNS email', () => {
  it('renders each address as a link that opens the email window', () => {
    expect(SUPPRESSION_COLUMNS.find((col) => col.field === 'email')?.cellRenderer).toBeTypeOf(
      'function',
    );
  });
});
