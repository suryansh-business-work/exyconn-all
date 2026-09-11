import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * The updater downloads the file latest*.yml names, through the portal's feed, from the
 * GitHub release. GitHub renames an uploaded file with a space in it ("Exyconn Tracker-…"
 * becomes "Exyconn.Tracker-…"), but the manifest keeps the space — so the file it asks for
 * is not on the release, and every in-app update fails to download. Nothing errors at build
 * time; only the installed fleet notices. So the names are read back here rather than trusted.
 */
const BUILDER = fileURLToPath(new URL('../../electron-builder.yml', import.meta.url));

/** Every `artifactName:` value in electron-builder.yml. */
function artifactNames(): string[] {
  const source = readFileSync(BUILDER, 'utf8');
  return [...source.matchAll(/^\s*artifactName:\s*(.+?)\s*$/gm)].map((match) => match[1]);
}

describe('installer file names', () => {
  it('names the installer of every platform', () => {
    expect(artifactNames()).toHaveLength(3);
  });

  it('never contain a space, so the release keeps the name the manifest asks for', () => {
    for (const name of artifactNames()) {
      expect(name).not.toContain(' ');
      // The product name has a space in it — using it here is the same bug by another route.
      expect(name).not.toContain('${productName}');
    }
  });
});
