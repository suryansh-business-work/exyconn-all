import { describe, expect, it } from 'vitest';
import type { TrackerTotals } from '@shared/types';
import { totalTiles, type Tile } from '../../../../src/renderer/tiles';

function tile(tiles: Tile[], id: string): Tile {
  const found = tiles.find((entry) => entry.id === id);
  if (found === undefined) {
    throw new Error(`No tile "${id}"`);
  }
  return found;
}

function fact(target: Tile, id: string): string {
  return target.detail.facts.find((entry) => entry.id === id)?.value ?? 'missing';
}

const TOTALS: TrackerTotals = {
  activeMs: 9 * 3_600_000,
  idleMs: 3_600_000,
  screenshots: 25,
  sessions: 4,
};

describe('totalTiles', () => {
  it('shows the four all-time totals in hours and minutes, never seconds', () => {
    const tiles = totalTiles(TOTALS);
    expect(tiles.map((entry) => entry.id)).toEqual([
      'total-worked',
      'total-idle',
      'total-screenshots',
      'total-sessions',
    ]);
    expect(tile(tiles, 'total-worked').value).toBe('9h 0m');
    expect(tile(tiles, 'total-idle').value).toBe('1h 0m');
    expect(tile(tiles, 'total-screenshots').value).toBe('25');
    expect(tile(tiles, 'total-sessions').value).toBe('4');
  });

  it('derives shares, averages and rates from the totals', () => {
    const tiles = totalTiles(TOTALS);
    const worked = tile(tiles, 'total-worked');
    expect(worked.detail.headline).toBe('9h 0m');
    expect(fact(worked, 'share')).toBe('90%');
    expect(fact(worked, 'sessions')).toBe('4 sessions');
    expect(fact(worked, 'average')).toBe('2h 30m');

    const idle = tile(tiles, 'total-idle');
    expect(idle.detail.headline).toBe('1h 0m');
    expect(fact(idle, 'share')).toBe('10%');
    expect(fact(idle, 'worked')).toBe('9h 0m');

    const shots = tile(tiles, 'total-screenshots');
    expect(shots.detail.headline).toBe('25 screenshots');
    expect(fact(shots, 'rate')).toBe('6 per session');
    expect(fact(shots, 'sessions')).toBe('4 sessions');

    const sessions = tile(tiles, 'total-sessions');
    expect(sessions.detail.headline).toBe('4 sessions');
    expect(fact(sessions, 'average')).toBe('2h 30m');
    expect(fact(sessions, 'worked')).toBe('9h 0m');
  });

  it('says there is nothing yet for a brand-new employee instead of dividing by zero', () => {
    const tiles = totalTiles({ activeMs: 0, idleMs: 0, screenshots: 0, sessions: 0 });
    expect(fact(tile(tiles, 'total-worked'), 'share')).toBe('0%');
    expect(fact(tile(tiles, 'total-worked'), 'average')).toBe('No sessions yet');
    expect(fact(tile(tiles, 'total-idle'), 'share')).toBe('100%');
    expect(fact(tile(tiles, 'total-screenshots'), 'rate')).toBe('No sessions yet');
    expect(fact(tile(tiles, 'total-sessions'), 'average')).toBe('No sessions yet');
  });

  it('gives every tile a note', () => {
    for (const entry of totalTiles(TOTALS)) {
      expect(entry.detail.note).not.toBe('');
    }
  });
});
