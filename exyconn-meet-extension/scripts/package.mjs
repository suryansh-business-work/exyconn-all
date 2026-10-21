/**
 * Packages the verified build into artifacts/:
 *   chrome-meeting-assistant-v<build version>.zip        internal channel (keeps the manifest `key`)
 *   chrome-meeting-assistant-v<build version>-store.zip  Chrome Web Store (no `key`)
 * each with a .sha256 file, plus release.json. Zips are deterministic (sorted entries, fixed
 * timestamps), with manifest.json at the zip root.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { listFiles } from './lib/files.mjs';
import { MIN_CHROME_VERSION, storeManifest } from './lib/manifest.mjs';
import { BUILD_NUMBER, BUILD_VERSION } from './lib/defines.mjs';
import { ARTIFACTS_DIR, OUT_DIR } from './lib/paths.mjs';
import { createZip } from './lib/zip.mjs';

if (!existsSync(join(OUT_DIR, 'manifest.json'))) {
  console.error(`No build found at ${OUT_DIR}. Run a build and verify first.`);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(join(OUT_DIR, 'manifest.json'), 'utf8'));
if (manifest.version !== BUILD_VERSION) {
  console.error(
    `The build is ${manifest.version} but this package run is ${BUILD_VERSION}. Rebuild with the same EXTENSION_BUILD_NUMBER first.`,
  );
  process.exit(1);
}

const sha256 = (data) => createHash('sha256').update(data).digest('hex');

/** The commit a release is built from: CI names it; a local package is marked as such. */
function commitSha() {
  return process.env.GITHUB_SHA ?? 'local';
}

const files = listFiles(OUT_DIR)
  .filter((path) => path !== 'manifest.json' && !path.endsWith('.map'))
  .map((path) => ({ path, data: readFileSync(join(OUT_DIR, path)) }));

const channels = [
  { channel: 'internal', name: `chrome-meeting-assistant-v${BUILD_VERSION}.zip`, manifest },
  {
    channel: 'store',
    name: `chrome-meeting-assistant-v${BUILD_VERSION}-store.zip`,
    manifest: storeManifest(manifest),
  },
];

mkdirSync(ARTIFACTS_DIR, { recursive: true });
const written = channels.map(({ channel, name, manifest: channelManifest }) => {
  const zip = createZip([
    ...files,
    { path: 'manifest.json', data: `${JSON.stringify(channelManifest, null, 2)}\n` },
  ]);
  const digest = sha256(zip);
  writeFileSync(join(ARTIFACTS_DIR, name), zip);
  writeFileSync(join(ARTIFACTS_DIR, `${name}.sha256`), `${digest}  ${name}\n`);
  return { name, size: zip.length, sha256: digest, channel };
});

const release = {
  version: BUILD_VERSION,
  buildNumber: BUILD_NUMBER,
  commitSha: commitSha(),
  builtAt: new Date().toISOString(),
  minChromeVersion: MIN_CHROME_VERSION,
  // The channel a portal "Build new release" asked for; the portal's sync registers it there.
  releaseChannel: process.env.RELEASE_CHANNEL || 'INTERNAL',
  files: written,
};
writeFileSync(join(ARTIFACTS_DIR, 'release.json'), `${JSON.stringify(release, null, 2)}\n`);

for (const file of written) {
  console.log(`${file.channel.padEnd(8)} ${file.name}  ${file.size} bytes  sha256 ${file.sha256}`);
}
