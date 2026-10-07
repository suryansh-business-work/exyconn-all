import { describe, expect, it } from 'vitest';
import { TEAM_COLUMNS } from '../../../../src/pages/teams/team-grid';
import { actionKeys, columnIds } from '../../harness/grid';

describe('TEAM_COLUMNS', () => {
  it('lays out the register with edit and delete at the end', () => {
    expect(columnIds(TEAM_COLUMNS)).toEqual(['name', 'department', 'active', 'actions']);
    expect(actionKeys(TEAM_COLUMNS)).toEqual(['edit', 'delete']);
  });

  it('heads each column in the words HR uses', () => {
    expect(TEAM_COLUMNS.map((column) => column.headerName)).toEqual([
      'Team',
      'Department',
      'Active',
      '',
    ]);
  });
});
