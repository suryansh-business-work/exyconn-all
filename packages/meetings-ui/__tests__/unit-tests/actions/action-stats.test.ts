import { describe, expect, it } from 'vitest';
import { actionStats, completionPercent } from '../../../src/actions/action-stats';

const STATS = {
  total: 12,
  pending: 3,
  inProgress: 2,
  blocked: 1,
  completed: 4,
  cancelled: 2,
  overdue: 1,
  needsConfirmation: 2,
};
const formatters = {
  formatNumber: (value: number) => `n${value}`,
  formatPercent: (value: number) => `${value} pct`,
};

describe('completionPercent', () => {
  it('counts completed items against every item that was not cancelled', () => {
    expect(completionPercent(STATS)).toBe(40);
  });

  it('is zero when nothing counts', () => {
    expect(completionPercent(undefined)).toBe(0);
    expect(completionPercent({ ...STATS, total: 2, cancelled: 2 })).toBe(0);
  });
});

describe('actionStats', () => {
  it('writes the completion tiles, each explaining itself', () => {
    const tiles = actionStats(STATS, formatters);
    expect(tiles.map((tile) => [tile.label, tile.value])).toEqual([
      ['Completed', '40 pct'],
      ['Open', 'n5'],
      ['Blocked', 'n1'],
      ['Overdue', 'n1'],
      ['Needs confirmation', 'n2'],
    ]);
    expect(tiles.every((tile) => Boolean(tile.info))).toBe(true);
  });

  it('shows zeros before the stats arrive', () => {
    expect(actionStats(undefined, formatters).map((tile) => tile.value)).toEqual([
      '0 pct',
      'n0',
      'n0',
      'n0',
      'n0',
    ]);
  });
});
