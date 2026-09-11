import { describe, expect, it } from 'vitest';
import { formatCount } from '@exyconn/tracker-core';
import { sessionTiles } from '../../../src/lib/dashboard/session-tiles';
import type { Tile } from '../../../src/lib/dashboard/tile.types';
import { ANDROID, IOS, settings, stats } from './fixtures';

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

describe('sessionTiles', () => {
  it('keeps worked, idle, keys & taps, app in front and screenshots, in that order', () => {
    const ids = sessionTiles(stats(), settings(), ANDROID).map((tile) => tile.id);
    expect(ids).toEqual(['worked', 'idle', 'input', 'app', 'screenshots']);
  });

  it('gives every tile and fact a unique id and a note', () => {
    for (const tile of sessionTiles(stats(), settings(), ANDROID)) {
      const factIds = tile.detail.facts.map((fact) => fact.id);
      expect(new Set(factIds).size).toBe(factIds.length);
      expect(tile.detail.note.length).toBeGreaterThan(0);
    }
  });

  it('shows worked and idle time with their shares of the session', () => {
    const tiles = sessionTiles(stats(), settings(), ANDROID);
    const worked = tileOf(tiles, 'worked');
    expect(worked.value).toBe('0h 45m 0s');
    // Counts are grouped in the device's locale, so the expectation is too.
    expect(worked.detail.headline).toBe(`0h 45m 0s (${formatCount(2700)} seconds)`);
    expect(factOf(worked, 'share')).toBe('75% active');
    expect(factOf(worked, 'threshold')).toBe('300 seconds');
    expect(factOf(tileOf(tiles, 'idle'), 'share')).toBe('25% idle');
  });

  it('says Unknown rather than guessing before the settings load', () => {
    const tiles = sessionTiles(stats(), null, ANDROID);
    expect(factOf(tileOf(tiles, 'worked'), 'threshold')).toBe('Unknown');
    expect(factOf(tileOf(tiles, 'screenshots'), 'cadence')).toBe('Unknown');
  });

  it('never shows a zero for keys or taps — a phone measures neither', () => {
    for (const caps of [ANDROID, IOS]) {
      const tiles = sessionTiles(stats(), settings(), caps);
      const input = tileOf(tiles, 'input');
      expect(input.value).toBe('Not measured');
      expect(input.detail.headline).toBe('Not measured on a phone');
      expect(tiles.some((tile) => tile.value === '0' && tile.id !== 'screenshots')).toBe(false);
    }
  });

  it('describes an Android session by its screen and lock state', () => {
    const tiles = sessionTiles(stats(), settings(), ANDROID);
    expect(tileOf(tiles, 'worked').detail.note).toContain('screen on and unlocked');
    expect(tileOf(tiles, 'idle').detail.note).toContain('screen off or the phone locked');
  });

  it('names the app in front on Android, and a dash when there is none', () => {
    expect(tileOf(sessionTiles(stats(), settings(), ANDROID), 'app').value).toBe('Slack');
    const empty = tileOf(sessionTiles(stats({ currentApp: '' }), settings(), ANDROID), 'app');
    expect(empty.value).toBe('—');
    expect(empty.detail.headline).toBe('Nothing in front');
  });

  it('counts Android screenshots with the workspace cadence', () => {
    const shots = tileOf(sessionTiles(stats(), settings(), ANDROID), 'screenshots');
    expect(shots.value).toBe('3');
    expect(factOf(shots, 'cadence')).toBe('2 per 10 minutes');
    expect(factOf(shots, 'timing')).toBe('At a random moment');
    expect(factOf(shots, 'blur')).toBe('Off');
    expect(factOf(shots, 'webcam')).toBe('On');
  });

  it('explains on an iPhone that there is no app in front and no screenshots', () => {
    const tiles = sessionTiles(stats(), settings(), IOS);
    const app = tileOf(tiles, 'app');
    expect(app.value).toBe('Not available');
    expect(app.detail.headline).toBe("iPhone doesn't let apps see other apps");
    const shots = tileOf(tiles, 'screenshots');
    expect(shots.value).toBe('None on iPhone');
    expect(shots.detail.headline).toBe("iPhone doesn't allow screenshots");
    expect(tileOf(tiles, 'worked').detail.note).toContain('open on your screen');
  });

  it('reads an empty session as nothing active rather than dividing by zero', () => {
    const tiles = sessionTiles(stats({ sessionActiveMs: 0, sessionIdleMs: 0 }), null, ANDROID);
    expect(factOf(tileOf(tiles, 'worked'), 'share')).toBe('0% active');
    expect(factOf(tileOf(tiles, 'idle'), 'share')).toBe('100% idle');
  });
});
