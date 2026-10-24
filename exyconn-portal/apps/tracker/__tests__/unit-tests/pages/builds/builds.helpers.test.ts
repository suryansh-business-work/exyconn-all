import { describe, expect, it } from 'vitest';
import { buildDetailsPath, installerUrls } from '../../../../src/pages/builds/builds.types';
import { FULL, PHONE } from './builds.fixtures';

describe('builds helpers', () => {
  it('opens a build under the release path', () => {
    expect(buildDetailsPath('42')).toBe('/tracker/builds/release/42');
  });

  it('lists every installer of the given builds, in order', () => {
    expect(installerUrls([PHONE, FULL])).toEqual([
      'https://dl.test/Tracker-1.3.9.apk',
      ...FULL.assets.map((a) => a.url),
    ]);
    expect(installerUrls([])).toEqual([]);
  });
});
