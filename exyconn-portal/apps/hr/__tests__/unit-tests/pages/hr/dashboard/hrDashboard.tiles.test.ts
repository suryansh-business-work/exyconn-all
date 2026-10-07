import { describe, expect, it } from 'vitest';
import {
  buildHrTiles,
  type HrTileInputs,
} from '../../../../../src/pages/hr/dashboard/hrDashboard.tiles';
import { tableStats } from '../../../harness/crud-page';

const base: HrTileInputs = {
  totalEmployees: 40,
  activeEmployees: 36,
  onLeave: 3,
  newJoiners: 2,
  today: { PRESENT: 20, ABSENT: 4, WFH: 9, HALF_DAY: 2 },
  pendingLeave: 5,
  requestStats: tableStats(9, { status: { PENDING: 4, DONE: 5 } }),
  goalStats: tableStats(12, { status: { ACTIVE: 7, DONE: 5 } }),
  reviewStats: tableStats(10, {
    status: { OPEN: 1, SELF_SUBMITTED: 2, MANAGER_SUBMITTED: 3, CLOSED: 4 },
  }),
  exitStats: tableStats(6, { stage: { NOTICE: 3, EXITED: 2, WITHDRAWN: 1 } }),
};

const lines = (inputs: HrTileInputs) =>
  buildHrTiles(inputs).map((tile) => `${tile.label}: ${tile.value}`);

describe('buildHrTiles', () => {
  it('writes every number an HR lead checks first thing', () => {
    expect(lines(base)).toEqual([
      'Employees: 40',
      'Active / inactive: 36 / 4',
      'New this month: 2',
      'On leave: 3',
      'Present today: 22',
      'WFH today: 9',
      'Leave to approve: 5',
      'Requests pending: 4',
      'Active goals: 7',
      'Appraisals open: 6',
      'Exits in progress: 3',
    ]);
    expect(buildHrTiles(base).every((tile) => typeof tile.accent === 'string')).toBe(true);
  });

  it('reads zeros, never negatives, before the stats arrive', () => {
    const tiles = lines({
      ...base,
      totalEmployees: 2,
      activeEmployees: 5,
      requestStats: undefined,
      goalStats: null,
      reviewStats: undefined,
      exitStats: undefined,
    });
    expect(tiles).toContain('Active / inactive: 5 / 0');
    expect(tiles.slice(7)).toEqual([
      'Requests pending: 0',
      'Active goals: 0',
      'Appraisals open: 0',
      'Exits in progress: 0',
    ]);
  });

  it('never shows a negative count of exits in progress', () => {
    const tiles = lines({ ...base, exitStats: tableStats(1, { stage: { EXITED: 2 } }) });
    expect(tiles.at(-1)).toBe('Exits in progress: 0');
  });
});
