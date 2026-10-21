import { PERMISSIONS } from './manifest.mjs';

const ALLOWED_PERMISSIONS = new Set(PERMISSIONS);
const VERSION_FORMAT = /^\d+(\.\d+){0,3}$/;
const MAX_VERSION_PART = 65535;
/** Host patterns that grant every site: the special token, and a wildcard host under any scheme. */
const BROAD_MATCHES = new Set([
  '<all_urls>',
  ...['*', 'http', 'https'].map((scheme) => `${scheme}://*/*`),
]);
const REQUIRED_FIELDS = [
  'name',
  'version',
  'description',
  'icons',
  'action',
  'background',
  'content_scripts',
  'permissions',
  'host_permissions',
  'content_security_policy',
];

/** Chrome's rules for `version`: 1–4 dot-separated integers, each 0–65535, no leading zero. */
export function versionErrors(version) {
  if (typeof version !== 'string' || !VERSION_FORMAT.test(version)) {
    return [`version ${JSON.stringify(version)} must be 1 to 4 dot-separated integers`];
  }
  return version
    .split('.')
    .filter((part) => Number(part) > MAX_VERSION_PART || (part.length > 1 && part.startsWith('0')))
    .map((part) => `version part "${part}" must be 0–65535 without a leading zero`);
}

/** Every file the manifest points at. */
export function referencedFiles(manifest) {
  const files = new Set([
    ...Object.values(manifest.icons ?? {}),
    ...Object.values(manifest.action?.default_icon ?? {}),
  ]);
  for (const file of [
    manifest.action?.default_popup,
    manifest.background?.service_worker,
    manifest.options_ui?.page,
    manifest.options_page,
  ]) {
    if (typeof file === 'string') {
      files.add(file);
    }
  }
  for (const script of manifest.content_scripts ?? []) {
    for (const file of [...(script.js ?? []), ...(script.css ?? [])]) {
      files.add(file);
    }
  }
  return [...files].sort((a, b) => a.localeCompare(b));
}

function permissionErrors(manifest, production) {
  const errors = [];
  const permissions = Array.isArray(manifest.permissions) ? manifest.permissions : [];
  for (const permission of permissions.filter((p) => !ALLOWED_PERMISSIONS.has(p))) {
    errors.push(`permission "${permission}" is not on the allow-list`);
  }
  const hosts = [
    ...(manifest.host_permissions ?? []),
    ...(manifest.content_scripts ?? []).flatMap((script) => script.matches ?? []),
  ];
  for (const host of hosts.filter((h) => BROAD_MATCHES.has(h))) {
    errors.push(`host access "${host}" is too broad`);
  }
  if (production) {
    for (const host of hosts.filter((h) => h.startsWith('http://'))) {
      errors.push(`host access "${host}" is plain http in a production build`);
    }
  }
  return errors;
}

function shapeErrors(manifest) {
  const errors = [];
  if (manifest.manifest_version !== 3) {
    errors.push('manifest_version must be 3');
  }
  for (const field of REQUIRED_FIELDS.filter((f) => manifest[f] === undefined)) {
    errors.push(`missing "${field}"`);
  }
  if (manifest.background?.type !== 'module') {
    errors.push('background must be a module service worker');
  }
  const csp = manifest.content_security_policy?.extension_pages ?? '';
  if (
    !csp.includes("script-src 'self'") ||
    csp.includes('unsafe-eval') ||
    csp.includes('unsafe-inline')
  ) {
    errors.push(`content_security_policy.extension_pages "${csp}" must be script-src 'self' only`);
  }
  if (manifest.web_accessible_resources !== undefined) {
    errors.push('web_accessible_resources is not needed and must not be declared');
  }
  return errors;
}

/** Everything wrong with a built manifest; `exists(path)` checks the build output. */
export function manifestErrors(manifest, { exists, production }) {
  return [
    ...shapeErrors(manifest),
    ...versionErrors(manifest.version),
    ...permissionErrors(manifest, production),
    ...referencedFiles(manifest)
      .filter((file) => !exists(file))
      .map((file) => `referenced file "${file}" is missing`),
  ];
}

/** Code and secrets that must never ship. */
export const FORBIDDEN_PATTERNS = [
  { name: 'eval()', pattern: /\beval\s*\(/ },
  // `new Function("")` with an EMPTY body is zod's CSP probe (allowsEval), which never runs:
  // src/storage/prefs.ts sets `z.config({ jitless: true })`, and CSP would block it anyway.
  // Any other argument is dynamic code and fails.
  { name: 'new Function()', pattern: /\bnew\s+Function\s*\((?!\s*(?:""|'')\s*\))/ },
  {
    name: 'a remote script',
    pattern: /<script[^>]+src=["']https?:|importScripts\(\s*["']https?:|import\(\s*["']https?:/,
  },
  { name: 'an OpenAI-style secret key', pattern: /\bsk-[A-Za-z\d_-]{20,}/ },
  { name: 'a private key', pattern: /PRIVATE KEY-----/ },
];

/** XML namespace and JSON Schema URIs are identifiers, not hosts the extension talks to. */
const IDENTIFIER_PREFIXES = ['http://www.w3.org/', 'http://json-schema.org/'];
const HTTP_URL = /http:\/\/[^\s"'`)<>\\]+/g;

/** Problems in one bundle file's text. */
export function bundleErrors(file, text, { production }) {
  const errors = FORBIDDEN_PATTERNS.filter(({ pattern }) => pattern.test(text)).map(
    ({ name }) => `${file} contains ${name}`,
  );
  if (production) {
    const hosts = new Set(
      [...text.matchAll(HTTP_URL)]
        .map(([url]) => url)
        .filter((url) => !IDENTIFIER_PREFIXES.some((prefix) => url.startsWith(prefix))),
    );
    for (const url of hosts) {
      errors.push(`${file} references plain-http "${url}" in a production build`);
    }
  }
  return errors;
}
