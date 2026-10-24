import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadFiles } from '../../../../src/pages/builds/downloadFiles';
import { buildDetailsPath, installerUrls } from '../../../../src/pages/builds/builds.types';
import { FULL, PHONE } from './builds.fixtures';

describe('builds helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it('follows each file link once as a download and leaves nothing behind', () => {
    const clicked: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      expect(this.hasAttribute('download')).toBe(true);
      expect(this.rel).toBe('noopener');
      clicked.push(this.href);
    });
    downloadFiles(['https://dl.test/a.exe', 'https://dl.test/b.apk']);
    expect(clicked).toEqual(['https://dl.test/a.exe', 'https://dl.test/b.apk']);
    expect(document.querySelectorAll('a')).toHaveLength(0);
  });
});
