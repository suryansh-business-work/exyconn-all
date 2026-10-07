import { describe, expect, it } from 'vitest';
import { PROJECT_COLUMNS } from '../../../../src/pages/projects/projects-grid';
import { projectRow } from '../../fixtures';
import { actionSpecs, columnIds, formatCell, isActionHidden } from '../../helpers/grid-helpers';

describe('PROJECT_COLUMNS', () => {
  it('lists the project register columns, with the actions last', () => {
    expect(columnIds(PROJECT_COLUMNS)).toEqual([
      'key',
      'name',
      'clientName',
      'status',
      'startDate',
      'endDate',
      'description',
      'actions',
    ]);
  });

  it('shows the client, or a dash for internal work', () => {
    expect(formatCell(PROJECT_COLUMNS, 'clientName', projectRow())).toBe('Northwind');
    expect(formatCell(PROJECT_COLUMNS, 'clientName', projectRow({ clientName: '' }))).toBe('—');
  });

  it('shows the description, or a dash when there is none', () => {
    expect(formatCell(PROJECT_COLUMNS, 'description', projectRow())).toBe('Marketing site');
    expect(formatCell(PROJECT_COLUMNS, 'description', projectRow({ description: null }))).toBe('—');
  });

  it('offers the board, client links, edit and delete on every row', () => {
    expect(actionSpecs(PROJECT_COLUMNS).map((spec) => spec.key)).toEqual([
      'board',
      'share',
      'edit',
      'delete',
    ]);
    expect(isActionHidden(PROJECT_COLUMNS, 'board', projectRow())).toBe(false);
    expect(isActionHidden(PROJECT_COLUMNS, 'share', projectRow())).toBe(false);
  });
});
