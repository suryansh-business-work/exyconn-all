/**
 * Shared plumbing for the PR report scripts: each one reads what a CI step left on disk, writes
 * one markdown section to `reports/<name>.md`, and post.mjs joins the sections into the single
 * comment on the pull request.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";

export const REPORT_DIR = "reports";

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "out",
  REPORT_DIR,
]);

/** Every file under `root` whose path ends with `suffix` (e.g. `coverage/coverage-summary.json`). */
export function findFiles(suffix, root = ".") {
  const found = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) {
          walk(path);
        }
      } else if (path.endsWith(suffix)) {
        found.push(relative(root, path));
      }
    }
  };
  walk(root);
  return found.toSorted((a, b) => a.localeCompare(b));
}

/** The name in the nearest package.json at or above `dir`, else the directory itself. */
export function packageNameFor(dir) {
  let current = dir;
  while (current !== "." && current !== dirname(current)) {
    const manifest = join(current, "package.json");
    if (existsSync(manifest)) {
      return JSON.parse(readFileSync(manifest, "utf8")).name ?? current;
    }
    current = dirname(current);
  }
  return dir;
}

export function percent(covered, total) {
  return total === 0 ? 100 : (covered / total) * 100;
}

export function formatPercent(value) {
  return `${value.toFixed(1)}%`;
}

/** Markdown-safe table cell: pipes and newlines would break the row. */
export function cell(text) {
  return String(text)
    .replaceAll("|", String.raw`\|`)
    .replaceAll("\n", " ");
}

export function writeSection(name, markdown) {
  mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(join(REPORT_DIR, `${name}.md`), `${markdown.trim()}\n`);
  console.log(markdown);
}
