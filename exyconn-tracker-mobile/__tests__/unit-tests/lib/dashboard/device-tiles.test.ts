import { describe, expect, it } from 'vitest';
import { screenshotTile } from '../../../../src/lib/dashboard/device-tiles';
import type { Tile } from '../../../../src/lib/dashboard/tile.types';
import { ANDROID, settings, stats } from '../../dashboard/fixtures';

function factOf(tile: Tile, id: string): string | undefined {
  return tile.detail.facts.find((fact) => fact.id === id)?.value;
}

describe('screenshotTile on a phone that captures', () => {
  it('says captures land on the interval when the workspace does not randomise them', () => {
    const tile = screenshotTile(stats(), settings({ randomizeScreenshotTiming: false }), ANDROID);
    expect(factOf(tile, 'timing')).toBe('At the interval');
  });

  it('reports blurring on and the camera photo off as the workspace set them', () => {
    const tile = screenshotTile(
      stats({ screenshotCount: 12 }),
      settings({ blurScreenshots: true, webcamEnabled: false }),
      ANDROID,
    );
    expect(tile.detail.headline).toBe('12 this session');
    expect(factOf(tile, 'blur')).toBe('On');
    expect(factOf(tile, 'webcam')).toBe('Off');
  });

  it('shows dashes, not guesses, before the workspace settings load', () => {
    const tile = screenshotTile(stats(), null, ANDROID);
    expect(factOf(tile, 'cadence')).toBe('Unknown');
    expect(factOf(tile, 'timing')).toBe('At the interval');
    expect(factOf(tile, 'blur')).toBe('—');
    expect(factOf(tile, 'webcam')).toBe('—');
  });
});
