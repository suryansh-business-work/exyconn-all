/**
 * Registers a Meeting Assistant extension build with the portal (maRegisterRelease), so it
 * appears in AI › Meeting Assistant › Releases as QA_PENDING with its version, commit, size
 * and SHA-256. Registration is idempotent: the same version and channel with the same bytes
 * returns the existing release; different bytes are refused by the server.
 *
 * Env: PORTAL_API_URL, MEET_EXTENSION_REGISTER_API_KEY (an Integrations API key with the
 * ADMIN role, made in the platform operator company), RELEASE_ASSETS (the gh-release
 * action's `assets` output), RELEASE_URL, RELEASE_CHANNEL, BUILD_RUN_URL.
 */
import { readFileSync } from 'node:fs';

const env = (name, fallback) => {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`${name} is not set`);
  }
  return value;
};

const release = JSON.parse(readFileSync('exyconn-meet-extension/artifacts/release.json', 'utf8'));
const internal = release.files.find((file) => file.channel === 'internal');
const assets = JSON.parse(env('RELEASE_ASSETS'));
const asset = assets.find((candidate) => candidate.name === internal.name);
if (!asset) {
  throw new Error(`The GitHub release has no asset named ${internal.name}`);
}

const query = `mutation Register($input: MaRegisterReleaseInput!) {
  maRegisterRelease(input: $input) { id version channel status sha256 }
}`;
const input = {
  version: release.version,
  channel: env('RELEASE_CHANNEL', 'INTERNAL'),
  buildNumber: Number(release.buildNumber),
  commitSha: release.commitSha,
  builtAt: release.builtAt,
  artifactName: internal.name,
  artifactSize: internal.size,
  sha256: internal.sha256,
  assetUrl: asset.url,
  releaseUrl: env('RELEASE_URL'),
  buildRunUrl: env('BUILD_RUN_URL'),
  releaseNotes: process.env.RELEASE_NOTES ?? '',
  minChromeVersion: release.minChromeVersion ?? '116',
};

const response = await fetch(`${env('PORTAL_API_URL')}/graphql`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-api-key': env('MEET_EXTENSION_REGISTER_API_KEY') },
  body: JSON.stringify({ query, variables: { input } }),
  signal: AbortSignal.timeout(30_000),
});
const body = await response.json();
if (!response.ok || body.errors?.length) {
  console.error(JSON.stringify(body.errors ?? body));
  process.exit(1);
}
const registered = body.data.maRegisterRelease;
console.log(`Registered ${registered.version} (${registered.channel}) as ${registered.status}, sha256 ${registered.sha256}`);
