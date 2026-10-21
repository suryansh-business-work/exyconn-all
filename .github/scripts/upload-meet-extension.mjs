/**
 * Uploads the packaged Meeting Assistant build to the portal server, which stores the ZIP and
 * registers it as QA_PENDING in AI › Meeting Assistant › Releases.
 *
 * Authenticated with this run's GitHub Actions OIDC token (the job needs `id-token: write`),
 * requested for the audience PORTAL_API_URL. No secret is involved: the server checks GitHub's
 * signature and the repository, workflow and branch claims. Exits non-zero on any failure.
 *
 * Env: PORTAL_API_URL, RELEASE_NOTES (optional; the merge's commit message),
 * ACTIONS_ID_TOKEN_REQUEST_URL and ACTIONS_ID_TOKEN_REQUEST_TOKEN (set by GitHub Actions).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ARTIFACTS = 'exyconn-meet-extension/artifacts';

const need = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set (the job needs permissions: id-token: write)`);
  }
  return value;
};

const api = need('PORTAL_API_URL').replace(/\/$/, '');

const tokenUrl = new URL(need('ACTIONS_ID_TOKEN_REQUEST_URL'));
tokenUrl.searchParams.set('audience', api);
const tokenResponse = await fetch(tokenUrl, {
  headers: { Authorization: `Bearer ${need('ACTIONS_ID_TOKEN_REQUEST_TOKEN')}` },
  signal: AbortSignal.timeout(30_000),
});
if (!tokenResponse.ok) {
  console.error(`::error::Could not get a GitHub OIDC token (${tokenResponse.status})`);
  process.exit(1);
}
const { value: idToken } = await tokenResponse.json();

const manifest = readFileSync(join(ARTIFACTS, 'release.json'), 'utf8');
const internal = JSON.parse(manifest).files.find((file) => file.channel === 'internal');
const zip = readFileSync(join(ARTIFACTS, internal.name));

const form = new FormData();
form.append('release', manifest);
form.append('notes', process.env.RELEASE_NOTES ?? '');
form.append('file', new Blob([zip], { type: 'application/zip' }), internal.name);

const response = await fetch(`${api}/meet-assistant/releases/upload`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${idToken}` },
  body: form,
  signal: AbortSignal.timeout(120_000),
});
const body = await response.text();
if (!response.ok) {
  console.error(`::error::The portal refused the upload (${response.status}): ${body}`);
  process.exit(1);
}
const result = JSON.parse(body);
const outcome = result.created ? 'Uploaded' : 'Already stored:';
console.log(`${outcome} ${result.version} (${result.status}), ${internal.size} bytes, sha256 ${internal.sha256}`);
