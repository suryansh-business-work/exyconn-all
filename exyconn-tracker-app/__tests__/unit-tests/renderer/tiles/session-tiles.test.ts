import { describe, expect, it } from 'vitest';
import type { LiveStats, TrackerSettings } from '@shared/types';
import { sessionTiles, type Tile } from '../../../../src/renderer/tiles';
import { trackerState } from '../../../../src/renderer/a11y/tracker-fixture';

const SETTINGS = trackerState('tracking').settings as TrackerSettings;

function stats(overrides: Partial<LiveStats> = {}): LiveStats {
  return { ...trackerState('tracking').stats, ...overrides };
}

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

describe('sessionTiles', () => {
  it('lays out the six live counters of the session in a fixed order', () => {
    const ids = sessionTiles(stats(), SETTINGS).map((entry) => entry.id);
    expect(ids).toEqual(['worked', 'idle', 'keys', 'mouse', 'app', 'screenshots']);
  });

  it('splits the session into active and idle shares that add up to 100', () => {
    const tiles = sessionTiles(
      stats({ sessionActiveMs: 270_000, sessionIdleMs: 90_000 }),
      SETTINGS,
    );
    const worked = tile(tiles, 'worked');
    expect(worked.value).toBe('0h 4m 30s');
    expect(worked.detail.headline).toBe('0h 4m 30s (270 seconds)');
    expect(fact(worked, 'share')).toBe('75% active');
    expect(fact(worked, 'idle')).toBe('0h 1m 30s');
    expect(fact(worked, 'threshold')).toBe('120 seconds');
    expect(fact(tile(tiles, 'idle'), 'share')).toBe('25% idle');
    expect(fact(tile(tiles, 'idle'), 'threshold')).toBe('120 seconds');
  });

  it('reads an empty session as 0% active rather than dividing by zero', () => {
    const tiles = sessionTiles(stats({ sessionActiveMs: 0, sessionIdleMs: 0 }), SETTINGS);
    expect(fact(tile(tiles, 'worked'), 'share')).toBe('0% active');
    expect(fact(tile(tiles, 'idle'), 'share')).toBe('100% idle');
  });

  it('gives input rates per ACTIVE minute only once a minute has been worked', () => {
    const early = sessionTiles(stats({ sessionActiveMs: 59_999, keyCount: 40 }), SETTINGS);
    expect(fact(tile(early, 'keys'), 'rate')).toBe('Not enough time yet');
    expect(fact(tile(early, 'mouse'), 'rate')).toBe('Not enough time yet');

    const later = sessionTiles(
      stats({ sessionActiveMs: 120_000, keyCount: 300, mouseCount: 50, sessionIdleMs: 600_000 }),
      SETTINGS,
    );
    const keys = tile(later, 'keys');
    expect(keys.value).toBe('300');
    expect(keys.detail.headline).toBe('300 key presses');
    expect(fact(keys, 'rate')).toBe('150 per active minute');
    expect(fact(keys, 'clicks')).toBe('50');
    const mouse = tile(later, 'mouse');
    expect(mouse.detail.headline).toBe('50 mouse clicks');
    expect(fact(mouse, 'rate')).toBe('25 per active minute');
    expect(fact(mouse, 'keys')).toBe('300');
  });

  it('names the foreground app, or says nothing is in front', () => {
    const named = tile(sessionTiles(stats({ currentApp: 'Code' }), SETTINGS), 'app');
    expect(named.value).toBe('Code');
    expect(named.detail.headline).toBe('Code');
    expect(fact(named, 'titles')).toBe('On');

    const none = tile(
      sessionTiles(stats({ currentApp: '' }), { ...SETTINGS, trackWindowTitles: false }),
      'app',
    );
    expect(none.value).toBe('—');
    expect(none.detail.headline).toBe('Nothing in the foreground');
    expect(fact(none, 'titles')).toBe('Off');
  });

  it('describes the screenshot cadence the workspace configured', () => {
    const shots = tile(sessionTiles(stats({ screenshotCount: 3 }), SETTINGS), 'screenshots');
    expect(shots.value).toBe('3');
    expect(shots.detail.headline).toBe('3 this session');
    expect(fact(shots, 'cadence')).toBe('1 per 10 minutes');
    expect(fact(shots, 'timing')).toBe('At a random moment');
    expect(fact(shots, 'blur')).toBe('Off');
    expect(fact(shots, 'webcam')).toBe('On');

    const fixed = tile(
      sessionTiles(stats(), {
        ...SETTINGS,
        randomizeScreenshotTiming: false,
        blurScreenshots: true,
        webcamEnabled: false,
      }),
      'screenshots',
    );
    expect(fact(fixed, 'timing')).toBe('At the interval');
    expect(fact(fixed, 'blur')).toBe('On');
    expect(fact(fixed, 'webcam')).toBe('Off');
  });

  it('admits what it does not know before the workspace settings arrive', () => {
    const tiles = sessionTiles(stats(), null);
    expect(fact(tile(tiles, 'worked'), 'threshold')).toBe('Unknown');
    expect(fact(tile(tiles, 'idle'), 'threshold')).toBe('Unknown');
    expect(fact(tile(tiles, 'app'), 'titles')).toBe('Unknown');
    const shots = tile(tiles, 'screenshots');
    expect(fact(shots, 'cadence')).toBe('Unknown');
    expect(fact(shots, 'timing')).toBe('At the interval');
    expect(fact(shots, 'blur')).toBe('—');
    expect(fact(shots, 'webcam')).toBe('—');
  });

  it('gives every tile a note explaining the rule behind its number', () => {
    for (const entry of sessionTiles(stats(), SETTINGS)) {
      expect(entry.detail.note.length).toBeGreaterThan(20);
      expect(entry.icon).toBeDefined();
    }
  });
});
