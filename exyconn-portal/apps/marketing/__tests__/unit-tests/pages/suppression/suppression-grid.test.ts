import { describe, expect, it } from 'vitest';
import { SUPPRESSION_COLUMNS } from '../../../../src/pages/suppression/suppression-grid';
import { actionSpecs, columnIds, formatCell } from '../../grid-helpers';
import { suppressionRow } from '../../fixtures';

describe('SUPPRESSION_COLUMNS', () => {
  it('lists the suppression columns, with the actions last', () => {
    expect(columnIds(SUPPRESSION_COLUMNS)).toEqual([
      'email',
      'reason',
      'source',
      'createdAt',
      'actions',
    ]);
  });

  it('shows where an address came from, or a dash when nobody noted it', () => {
    expect(formatCell(SUPPRESSION_COLUMNS, 'source', suppressionRow())).toBe('Footer link');
    expect(formatCell(SUPPRESSION_COLUMNS, 'source', suppressionRow({ source: '' }))).toBe('—');
  });

  it('dates each row through the viewer settings', () => {
    const row = suppressionRow();

    expect(
      formatCell(SUPPRESSION_COLUMNS, 'createdAt', row, {
        value: row.createdAt,
        context: { formatDate: (value: string) => `on ${value}` },
      }),
    ).toBe(`on ${row.createdAt}`);
  });

  it('offers only delete: a suppression is a record, never edited', () => {
    expect(actionSpecs(SUPPRESSION_COLUMNS).map((spec) => spec.key)).toEqual(['delete']);
  });
});
