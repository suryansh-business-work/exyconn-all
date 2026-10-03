import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * The installer's look lives in electron-builder.yml as paths to files under build/. A
 * renamed or missing file does not fail the build — electron-builder quietly falls back to
 * Electron's default icon and a plain NSIS wizard — so the paths are checked here.
 */
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const BUILDER = readFileSync(`${ROOT}electron-builder.yml`, 'utf8');

/** Every `build/…` file the config names. */
const assets = [...new Set([...BUILDER.matchAll(/\bbuild\/[\w@.-]+\.\w+/g)].map((m) => m[0]))];

/** Width, height and bit depth from a BMP's header. */
function bmpHeader(path: string): { width: number; height: number; bits: number } {
  const file = readFileSync(`${ROOT}${path}`);
  expect(file.toString('ascii', 0, 2)).toBe('BM');
  return { width: file.readInt32LE(18), height: file.readInt32LE(22), bits: file.readUInt16LE(28) };
}

describe('installer assets', () => {
  it('names an icon for every platform and the NSIS and DMG artwork', () => {
    expect(assets).toEqual(
      expect.arrayContaining([
        'build/icon.ico',
        'build/icon.icns',
        'build/icon.png',
        'build/installerSidebar.bmp',
        'build/installerHeader.bmp',
        'build/background.png',
      ]),
    );
  });

  it.each(assets)('%s exists', (path) => {
    expect(existsSync(`${ROOT}${path}`)).toBe(true);
  });

  it('ships the Retina DMG background beside the standard one', () => {
    expect(existsSync(`${ROOT}build/background@2x.png`)).toBe(true);
  });

  it.each([
    ['build/installerSidebar.bmp', 164, 314],
    ['build/installerHeader.bmp', 150, 57],
  ])('%s is a 24-bit bitmap at the size NSIS draws (%i×%i)', (path, width, height) => {
    expect(bmpHeader(path)).toEqual({ width, height, bits: 24 });
  });
});
