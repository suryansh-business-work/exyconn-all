import { describe, expect, it } from 'vitest';
import { AUDIENCE_COLUMNS } from '../../../../src/pages/audiences/audiences-grid';
import { actionSpecs, columnIds, formatCell } from '../../grid-helpers';
import { audienceRow } from '../../fixtures';

describe('AUDIENCE_COLUMNS', () => {
  it('lists the audience register columns, with the actions last', () => {
    expect(columnIds(AUDIENCE_COLUMNS)).toEqual([
      'name',
      'description',
      'named',
      'dynamicSegment',
      'actions',
    ]);
  });

  it('counts everyone typed into the list, clients and contacts together', () => {
    const row = audienceRow({ clientIds: ['c1', 'c2'], contactIds: ['p1'] });

    expect(formatCell(AUDIENCE_COLUMNS, 'named', row)).toBe('3');
    expect(
      formatCell(AUDIENCE_COLUMNS, 'named', audienceRow({ clientIds: [], contactIds: [] })),
    ).toBe('0');
  });

  it('writes nothing in the named cell while the row is still loading', () => {
    expect(formatCell(AUDIENCE_COLUMNS, 'named', undefined)).toBe('');
  });

  it('offers members before the default edit and delete actions', () => {
    const specs = actionSpecs(AUDIENCE_COLUMNS);

    expect(specs.map((spec) => spec.key)).toEqual(['members', 'edit', 'delete']);
    expect(specs[0]).toMatchObject({ label: 'view members', color: 'primary' });
  });
});
