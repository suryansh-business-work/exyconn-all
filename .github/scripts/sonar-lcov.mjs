#!/usr/bin/env node
/**
 * Gathers every lcov report a coverage run left behind into sonar-coverage/, with each source
 * path rewritten relative to the repository root.
 *
 * SonarQube resolves an lcov `SF:` path against the project root. Vitest writes paths relative to
 * the package it ran in and jest/nyc write absolute ones, so one `sonar.javascript.lcov.reportPaths`
 * glob would otherwise match nothing for most packages.
 *
 * Usage: node .github/scripts/sonar-lcov.mjs <dir that holds the downloaded artifacts>
 */
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

const root = process.cwd();
const searchDir = resolve(process.argv[2] ?? '.');
const outDir = join(root, 'sonar-coverage');
const SKIPPED = new Set(['node_modules', '.git', 'sonar-coverage']);

function findReports(dir, found = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIPPED.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      findReports(full, found);
    } else if (entry.endsWith('.lcov') || entry === 'lcov.info') {
      found.push(full);
    }
  }
  return found;
}

/** The directory a report's relative paths are relative to: the package that owns `coverage/`. */
function baseOf(report) {
  const dir = dirname(report);
  return dir.endsWith(`${sep}coverage`) ? dirname(dir) : dir;
}

/**
 * A source path from an lcov report, as a path relative to the repository root.
 *
 * Vitest writes paths relative to its package, jest/nyc write absolute ones, and `nyc report`
 * run from the repository root writes paths relative to the root. Which one a relative path is
 * cannot be told from its text, so the one that names a file that exists wins.
 */
function toRepoPath(sourcePath, base) {
  if (isAbsolute(sourcePath)) {
    const rel = relative(root, sourcePath);
    return rel.startsWith('..') ? sourcePath : rel;
  }
  const fromBase = resolve(base, sourcePath);
  const fromRoot = resolve(root, sourcePath);
  if (existsSync(fromBase)) {
    return relative(root, fromBase);
  }
  if (existsSync(fromRoot)) {
    return relative(root, fromRoot);
  }
  return relative(root, fromBase);
}

mkdirSync(outDir, { recursive: true });
let count = 0;
for (const report of findReports(searchDir)) {
  const base = baseOf(report);
  const text = readFileSync(report, 'utf8').replaceAll(/^SF:(.*)$/gm, (_all, path) => {
    return `SF:${toRepoPath(path.trim(), base).split(sep).join('/')}`;
  });
  count += 1;
  writeFileSync(join(outDir, `report-${count}.lcov`), text);
}
console.log(`Prepared ${count} lcov report(s) in sonar-coverage/`);
