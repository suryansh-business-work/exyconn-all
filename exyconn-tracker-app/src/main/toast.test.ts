import { describe, it, expect, vi } from 'vitest';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// The toast image is written under app.getPath('temp'); point that at a temp dir for the test.
const tempDir = mkdtempSync(join(tmpdir(), 'toast-'));
vi.mock('electron', () => ({
  app: { getPath: () => tempDir },
}));

import { heroToastXml } from './toast';

const PNG = Buffer.from('fake-png');

/** Stands in for the resized capture the notifier hands over. */
const image = { toPNG: () => PNG } as unknown as Electron.NativeImage;

/** The one image element the toast may carry, so the assertions can read its attributes. */
function imageTag(xml: string): string {
  return /<image[^>]*\/>/.exec(xml)?.[0] ?? '';
}

describe('heroToastXml', () => {
  it('puts the capture above the text and writes it where the shell can read it', () => {
    const xml = heroToastXml('Screenshot captured', ['Worked 1h 00m'], image);

    expect(imageTag(xml ?? '')).toContain('placement="hero"');
    expect(xml?.indexOf('<image')).toBeLessThan(xml?.indexOf('<text>') ?? 0);
    expect(xml).toContain('<text>Screenshot captured</text><text>Worked 1h 00m</text>');

    const src = /src="file:\/\/([^"]+)"/.exec(xml ?? '')?.[1] ?? '';
    const file = decodeURIComponent(src);
    expect(existsSync(file)).toBe(true);
    expect(readFileSync(file)).toEqual(PNG);
  });

  it('rotates files so a toast still on screen is never overwritten', () => {
    const first = heroToastXml('One', [], image);
    const second = heroToastXml('Two', [], image);

    expect(imageTag(first ?? '')).not.toEqual(imageTag(second ?? ''));
  });

  it('escapes text so an app name with markup cannot break the toast', () => {
    const xml = heroToastXml('Captured', ['In <Notes> & "Mail"'], image);

    expect(xml).toContain('<text>In &lt;Notes&gt; &amp; &quot;Mail&quot;</text>');
  });

  it('gives up on the toast when the preview cannot be written', () => {
    const unwritable = {
      toPNG: () => {
        throw new Error('decode failed');
      },
    } as unknown as Electron.NativeImage;

    expect(heroToastXml('Captured', [], unwritable)).toBeUndefined();
  });
});
