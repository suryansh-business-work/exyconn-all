/**
 * Chrome Web Store API (v2) for the Meeting Assistant: uploads the store package and, ONLY
 * when asked explicitly, submits it for review. It never reports a release as published —
 * the store decides that after review; the final status is printed for the run log and must
 * be confirmed in the portal (AI › Meeting Assistant › Releases) once the store publishes.
 *
 * Env: CWS_CLIENT_ID, CWS_CLIENT_SECRET, CWS_REFRESH_TOKEN (OAuth client of the publisher
 * account, scope chromewebstore), CWS_PUBLISHER_ID, CWS_ITEM_ID, CWS_ZIP (path),
 * CWS_SUBMIT ('true' to submit for review).
 */
import { readFileSync } from 'node:fs';

const API = 'https://chromewebstore.googleapis.com';
const need = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
};

async function accessToken() {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: need('CWS_CLIENT_ID'),
      client_secret: need('CWS_CLIENT_SECRET'),
      refresh_token: need('CWS_REFRESH_TOKEN'),
      grant_type: 'refresh_token',
    }),
  });
  const body = await response.json();
  if (!response.ok || !body.access_token) {
    throw new Error(`Google refused the store credentials: ${body.error ?? response.status}`);
  }
  return body.access_token;
}

async function call(token, method, path, body) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/zip' } : {}) },
    body,
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Chrome Web Store ${path} failed (${response.status}): ${text.slice(0, 500)}`);
  }
  return text ? JSON.parse(text) : {};
}

const token = await accessToken();
const item = `publishers/${need('CWS_PUBLISHER_ID')}/items/${need('CWS_ITEM_ID')}`;
const upload = await call(token, 'POST', `/upload/v2/${item}:upload`, readFileSync(need('CWS_ZIP')));
console.log(`Upload: ${JSON.stringify(upload)}`);
if (process.env.CWS_SUBMIT === 'true') {
  const submitted = await call(token, 'POST', `/v2/${item}:publish`);
  console.log(`Submitted for review: ${JSON.stringify(submitted)}`);
}
const status = await call(token, 'GET', `/v2/${item}:fetchStatus`);
console.log(`Store status: ${JSON.stringify(status)}`);
