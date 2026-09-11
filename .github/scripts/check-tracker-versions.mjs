#!/usr/bin/env node
/**
 * The desktop and mobile trackers ship as ONE release, tagged with the desktop version, and
 * Android derives its versionCode from the same number. scripts/bump-version.mjs keeps them
 * equal; this stops a release going out if anything ever let them drift.
 */
import { readFileSync } from 'node:fs';

const desktop = JSON.parse(readFileSync('exyconn-tracker-app/package.json', 'utf8')).version;
const mobile = JSON.parse(readFileSync('exyconn-tracker-mobile/package.json', 'utf8')).version;

if (desktop !== mobile) {
  console.error(
    `::error::exyconn-tracker-mobile is at ${mobile} but exyconn-tracker-app is at ${desktop}. Run \`node scripts/bump-version.mjs patch\` (it mirrors the version) and commit.`,
  );
  process.exit(1);
}
console.log(`Tracker version ${desktop} — desktop and mobile agree.`);
