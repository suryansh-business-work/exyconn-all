#!/usr/bin/env node
/**
 * Bumps the tracker's version — the desktop app's, mirrored into the mobile app's.
 *
 * This is the number that makes updates work at all: electron-builder stamps it on the
 * installer, the update feed serves it, and electron-updater compares the running app against
 * it to decide whether a newer build exists. A release shipped without bumping it is a release
 * no installed tracker will ever notice — which is exactly the symptom this fixes.
 *
 * The mobile app carries the SAME number: one tracker release builds the desktop installers and
 * the APK/AAB/IPA together, and Android derives its versionCode from it, so the phone must never
 * lag the desktop by a bump. Only the tracker apps are bumped. The root manifest's version
 * describes the repository, not a shipped artifact, and forcing the two to match would change
 * what the root number means.
 *
 * Usage: node scripts/bump-version.mjs [major|minor|patch]
 */
import { readFileSync, writeFileSync } from 'node:fs';

const MANIFEST = 'exyconn-tracker-app/package.json';
/** Kept equal to MANIFEST's version on every bump. */
const MIRRORS = ['exyconn-tracker-mobile/package.json'];
const LEVELS = new Set(['major', 'minor', 'patch']);

const level = process.argv[2] ?? 'patch';
if (!LEVELS.has(level)) {
  console.error(`Unknown bump level "${level}". Use major, minor or patch.`);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const parts = /^(\d+)\.(\d+)\.(\d+)$/.exec(manifest.version);
if (parts === null) {
  console.error(`${MANIFEST} has a version this script cannot bump: "${manifest.version}"`);
  process.exit(1);
}

const [major, minor, patch] = parts.slice(1).map(Number);
/** A bump resets everything below it — 1.3.4 minor is 1.4.0, never 1.4.4. */
const next = {
  major: `${major + 1}.0.0`,
  minor: `${major}.${minor + 1}.0`,
  patch: `${major}.${minor}.${patch + 1}`,
}[level];

const before = manifest.version;
manifest.version = next;
writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`${MANIFEST}: ${before} -> ${next} (${level})`);

for (const mirror of MIRRORS) {
  const copy = JSON.parse(readFileSync(mirror, 'utf8'));
  copy.version = next;
  writeFileSync(mirror, `${JSON.stringify(copy, null, 2)}\n`);
  console.log(`${mirror}: -> ${next} (mirrored)`);
}
