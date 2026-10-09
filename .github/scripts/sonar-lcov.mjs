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
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

const root = process.cwd();
const searchDir = resolve(process.argv[2] ?? ".");
const outDir = join(root, "sonar-coverage");
const SKIPPED = new Set(["node_modules", ".git", "sonar-coverage"]);

function findReports(dir, found = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIPPED.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      findReports(full, found);
    } else if (entry.endsWith(".lcov") || entry === "lcov.info") {
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

function toRepoPath(sourcePath, base) {
  const absolute = isAbsolute(sourcePath)
    ? sourcePath
    : resolve(base, sourcePath);
  // A runner checks out at one path and the sonar job at the same one, but fall back to the
  // package-relative path rather than emit something outside the repository.
  const rel = relative(root, absolute);
  return rel.startsWith("..") ? relative(root, resolve(base, sourcePath)) : rel;
}

mkdirSync(outDir, { recursive: true });
let count = 0;
for (const report of findReports(searchDir)) {
  const base = baseOf(report);
  const text = readFileSync(report, "utf8").replaceAll(
    /^SF:(.*)$/gm,
    (_all, path) => {
      return `SF:${toRepoPath(path.trim(), base).split(sep).join("/")}`;
    },
  );
  count += 1;
  writeFileSync(join(outDir, `report-${count}.lcov`), text);
}
console.log(`Prepared ${count} lcov report(s) in sonar-coverage/`);
