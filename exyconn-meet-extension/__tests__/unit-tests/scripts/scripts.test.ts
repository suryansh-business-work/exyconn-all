// @vitest-environment node
import { inflateRawSync, inflateSync } from 'node:zlib';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { crc32 } from '../../../scripts/lib/crc32.mjs';
import {
  MODES,
  PACKAGE_VERSION,
  defineConstants,
  modeConfig,
} from '../../../scripts/lib/defines.mjs';
import { listFiles } from '../../../scripts/lib/files.mjs';
import { ARTIFACTS_DIR, BUILD_INFO, OUT_DIR, PACKAGE_DIR } from '../../../scripts/lib/paths.mjs';
import { PERMISSIONS, buildManifest, storeManifest } from '../../../scripts/lib/manifest.mjs';
import { ICON_COLORS, encodePng, renderIcon } from '../../../scripts/lib/png.mjs';
import {
  bundleErrors,
  manifestErrors,
  referencedFiles,
  versionErrors,
} from '../../../scripts/lib/verify-rules.mjs';
import { createZip } from '../../../scripts/lib/zip.mjs';

const API = 'https://portal-server.exyconn.com';
const everyFileExists = () => true;

describe('crc32', () => {
  it('matches the standard check value', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });
});

describe('modes', () => {
  it('has the three modes, with staging pointing at production', () => {
    expect(Object.keys(MODES)).toEqual(['development', 'staging', 'production']);
    expect(modeConfig('staging')).toEqual(modeConfig('production'));
    expect(modeConfig('production').apiUrl).toBe(API);
    expect(() => modeConfig('qa')).toThrow('Unknown build mode');
  });

  it('defines the compile-time constants', () => {
    expect(defineConstants('development')).toEqual({
      __API_URL__: '"http://localhost:4004"',
      __PORTAL_URL__: '"http://localhost:4021"',
      __MODE__: '"development"',
      __VERSION__: JSON.stringify(PACKAGE_VERSION),
    });
  });
});

describe('manifest', () => {
  it('builds a valid production MV3 manifest', () => {
    const manifest = buildManifest({ version: '1.2.3', apiUrl: API });
    expect(manifest).toMatchObject({
      manifest_version: 3,
      host_permissions: [`${API}/*`, 'https://meet.google.com/*'],
      permissions: PERMISSIONS,
      minimum_chrome_version: '116',
    });
    expect(manifest).not.toHaveProperty('key');
    expect(manifestErrors(manifest, { exists: everyFileExists, production: true })).toEqual([]);
  });

  it('carries the public key for internal builds and drops it for the store', () => {
    const manifest = buildManifest({ version: '1.0.0', apiUrl: API, key: 'PUBLICKEY' });
    expect(manifest.key).toBe('PUBLICKEY');
    expect(storeManifest(manifest)).not.toHaveProperty('key');
  });

  it('lists every referenced file once', () => {
    const files = referencedFiles({
      ...buildManifest({ version: '1.0.0', apiUrl: API }),
      options_page: 'legacy.html',
      content_scripts: [{ matches: [], js: ['content.js'], css: ['c.css'] }, {}],
    });
    expect(files).toEqual([
      'background.js',
      'c.css',
      'content.js',
      'icons/icon-128.png',
      'icons/icon-16.png',
      'icons/icon-32.png',
      'icons/icon-48.png',
      'legacy.html',
      'options.html',
      'popup.html',
    ]);
    expect(referencedFiles({})).toEqual([]);
  });
});

describe('manifest verification', () => {
  const good = buildManifest({ version: '1.0.0', apiUrl: API });

  it('rejects bad versions', () => {
    expect(versionErrors('1.0.0.0')).toEqual([]);
    expect(versionErrors('1.0.0.0.0')).toHaveLength(1);
    expect(versionErrors('1.65536')).toEqual([
      'version part "65536" must be 0–65535 without a leading zero',
    ]);
    expect(versionErrors('01.2')).toHaveLength(1);
    expect(versionErrors(3)).toHaveLength(1);
  });

  it('rejects broad hosts, extra permissions, plain http in production and missing files', () => {
    const bad = {
      ...good,
      manifest_version: 2,
      background: { service_worker: 'background.js' },
      permissions: [...PERMISSIONS, 'tabs'],
      host_permissions: ['<all_urls>', 'http://localhost:4004/*'],
      content_security_policy: { extension_pages: "script-src 'self' 'unsafe-eval'" },
      web_accessible_resources: [],
    };
    const errors = manifestErrors(bad, {
      exists: (file) => file !== 'content.js',
      production: true,
    });
    expect(errors).toEqual(
      expect.arrayContaining([
        'manifest_version must be 3',
        'background must be a module service worker',
        'permission "tabs" is not on the allow-list',
        'host access "<all_urls>" is too broad',
        'host access "http://localhost:4004/*" is plain http in a production build',
        expect.stringContaining('content_security_policy'),
        'web_accessible_resources is not needed and must not be declared',
        'referenced file "content.js" is missing',
      ]),
    );
  });

  it('reports missing fields and allows a development http API', () => {
    expect(
      manifestErrors(
        { manifest_version: 3, version: '1' },
        { exists: everyFileExists, production: false },
      ),
    ).toEqual(
      expect.arrayContaining([
        'missing "name"',
        'missing "permissions"',
        expect.stringContaining('content_security_policy'),
      ]),
    );
    const noMatches = {
      ...buildManifest({ version: '1.0.0', apiUrl: API }),
      content_scripts: [{ js: ['content.js'] }],
    };
    expect(manifestErrors(noMatches, { exists: everyFileExists, production: true })).toEqual([]);
    const dev = buildManifest({ version: '1.0.0', apiUrl: 'http://localhost:4004' });
    expect(manifestErrors(dev, { exists: everyFileExists, production: false })).toEqual([]);
  });
});

describe('bundle scan', () => {
  it('finds forbidden code and secrets', () => {
    const fakeKey = ['sk', 'abcdefghijklmnopqrstuvwxyz0123'].join('-');
    const privateKey = ['-----BEGIN', 'PRIVATE KEY-----'].join(' ');
    expect(bundleErrors('a.js', 'eval("x")', { production: false })).toEqual([
      'a.js contains eval()',
    ]);
    expect(bundleErrors('a.js', 'new Function("x")', { production: false })).toEqual([
      'a.js contains new Function()',
    ]);
    expect(bundleErrors('a.js', 'new Function(code)', { production: false })).toEqual([
      'a.js contains new Function()',
    ]);
    expect(
      bundleErrors('a.js', 'try { new Function(""); } catch {}', { production: false }),
    ).toEqual([]);
    expect(
      bundleErrors('a.html', '<script src="https://cdn.example/x.js">', { production: false }),
    ).toEqual(['a.html contains a remote script']);
    expect(bundleErrors('a.js', `const k = "${fakeKey}"`, { production: false })).toEqual([
      'a.js contains an OpenAI-style secret key',
    ]);
    expect(bundleErrors('a.js', privateKey, { production: false })).toEqual([
      'a.js contains a private key',
    ]);
  });

  it('flags plain-http hosts in production but not XML or JSON Schema identifiers', () => {
    const text =
      'a="http://www.w3.org/2000/svg";b="http://json-schema.org/draft-07/schema#";c="http://localhost:4004"';
    expect(bundleErrors('a.js', text, { production: true })).toEqual([
      'a.js references plain-http "http://localhost:4004" in a production build',
    ]);
    expect(bundleErrors('a.js', text, { production: false })).toEqual([]);
  });
});

describe('png', () => {
  it('encodes a decodable RGBA PNG', () => {
    const png = encodePng(2, 1, Uint8Array.from([255, 0, 0, 255, 0, 0, 255, 128]));
    expect(png.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
    expect(png.readUInt32BE(16)).toBe(2);
    expect(png.readUInt32BE(20)).toBe(1);
    const idatLength = png.readUInt32BE(33);
    const rows = inflateSync(png.subarray(41, 41 + idatLength));
    expect([...rows]).toEqual([0, 255, 0, 0, 255, 0, 0, 255, 128]);
  });

  it('renders the icon with a transparent corner and the brand fill inside', () => {
    const size = 32;
    const png = renderIcon(size);
    const rows = inflateSync(png.subarray(41, 41 + png.readUInt32BE(33)));
    const pixel = (x: number, y: number) => [
      ...rows.subarray(y * (size * 4 + 1) + 1 + x * 4, y * (size * 4 + 1) + 5 + x * 4),
    ];
    expect(pixel(0, 0)[3]).toBe(0);
    expect(pixel(3, 16)).toEqual([...ICON_COLORS.fill, 255]);
    expect(pixel(16, 16)).toEqual([...ICON_COLORS.ink, 255]);
  });
});

describe('zip', () => {
  it('is deterministic, sorted, and decodes back to the inputs', () => {
    const files = [
      { path: 'b.txt', data: 'bravo' },
      { path: 'manifest.json', data: '{"a":1}' },
      { path: 'a/c.txt', data: Buffer.from('charlie') },
    ];
    const zip = createZip(files);
    expect(createZip([...files].reverse())).toEqual(zip);
    const names: string[] = [];
    let offset = 0;
    while (zip.readUInt32LE(offset) === 0x04034b50) {
      const compressed = zip.readUInt32LE(offset + 18);
      const nameLength = zip.readUInt16LE(offset + 26);
      const name = zip.subarray(offset + 30, offset + 30 + nameLength).toString('utf8');
      const data = inflateRawSync(
        zip.subarray(offset + 30 + nameLength, offset + 30 + nameLength + compressed),
      );
      expect(crc32(data)).toBe(zip.readUInt32LE(offset + 14));
      expect(zip.readUInt16LE(offset + 12)).toBe(33);
      names.push(`${name}=${data.toString('utf8')}`);
      offset += 30 + nameLength + compressed;
    }
    expect(names).toEqual(['a/c.txt=charlie', 'b.txt=bravo', 'manifest.json={"a":1}']);
    const end = zip.length - 22;
    expect(zip.readUInt32LE(end)).toBe(0x06054b50);
    expect(zip.readUInt16LE(end + 10)).toBe(3);
  });
});

describe('paths', () => {
  it('builds into dist/chrome-meeting-assistant and packages into artifacts', () => {
    expect(OUT_DIR).toBe(join(PACKAGE_DIR, 'dist/chrome-meeting-assistant/'));
    expect(BUILD_INFO).toBe(join(PACKAGE_DIR, 'dist/build-info.json'));
    expect(ARTIFACTS_DIR).toBe(join(PACKAGE_DIR, 'artifacts/'));
  });
});

describe('listFiles', () => {
  it('lists nested files with forward slashes, sorted', () => {
    const dir = mkdtempSync(join(tmpdir(), 'meet-ext-'));
    mkdirSync(join(dir, 'icons'));
    writeFileSync(join(dir, 'manifest.json'), '{}');
    writeFileSync(join(dir, 'icons', 'icon-16.png'), '');
    expect(listFiles(dir)).toEqual(['icons/icon-16.png', 'manifest.json']);
  });
});
