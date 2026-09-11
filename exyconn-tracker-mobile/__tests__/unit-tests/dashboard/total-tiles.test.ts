import { describe, expect, it } from 'vitest';
import { totalTiles } from '../../../src/lib/dashboard/total-tiles';
import type { Tile } from '../../../src/lib/dashboard/tile.types';
import { ANDROID, IOS } from './fixtures';

const HOUR = 3_600_000;
const TOTALS = { activeMs: 30 * HOUR, idleMs: 10 * HOUR, screenshots: 90, sessions: 10 };

function tileOf(tiles: Tile[], id: string): Tile {
  const tile = tiles.find((candidate) => candidate.id === id);
  if (tile === undefined) {
    throw new Error(`No ${id} tile`);
  }
  return tile;
}

function factOf(tile: Tile, id: string): string | undefined {
  return tile.detail.facts.find((fact) => fact.id === id)?.value;
}

describe('totalTiles', () => {
  it('shows the four all-time figures in hours and minutes', () => {
    const tiles = totalTiles(TOTALS, ANDROID);
    expect(tiles.map((tile) => [tile.id, tile.value])).toEqual([
      ['total-worked', '30h 0m'],
      ['total-idle', '10h 0m'],
      ['total-screenshots', '90'],
      ['total-sessions', '10'],
    ]);
  });

  it('works out shares and averages', () => {
    const tiles = totalTiles(TOTALS, ANDROID);
    const worked = tileOf(tiles, 'total-worked');
    expect(factOf(worked, 'share')).toBe('75%');
    expect(factOf(worked, 'sessions')).toBe('10 sessions');
    expect(factOf(worked, 'average')).toBe('4h 0m');
    expect(factOf(tileOf(tiles, 'total-idle'), 'share')).toBe('25%');
    expect(factOf(tileOf(tiles, 'total-screenshots'), 'rate')).toBe('9 per session');
  });

  it('says there are no sessions yet instead of dividing by zero', () => {
    const tiles = totalTiles({ activeMs: 0, idleMs: 0, screenshots: 0, sessions: 0 }, ANDROID);
    expect(factOf(tileOf(tiles, 'total-worked'), 'share')).toBe('0%');
    expect(factOf(tileOf(tiles, 'total-sessions'), 'average')).toBe('No sessions yet');
    expect(factOf(tileOf(tiles, 'total-screenshots'), 'rate')).toBe('No sessions yet');
  });

  it('tells an iPhone user its screenshots come from their other devices', () => {
    const android = tileOf(totalTiles(TOTALS, ANDROID), 'total-screenshots').detail.note;
    const ios = tileOf(totalTiles(TOTALS, IOS), 'total-screenshots').detail.note;
    expect(android).not.toContain('iPhone');
    expect(ios).toContain('This iPhone takes none');
  });
});
