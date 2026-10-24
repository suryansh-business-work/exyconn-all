#!/usr/bin/env node
/**
 * Collects every English UI string the portals, shared packages and trackers render, into the
 * catalogue the server translates a whole language from (Admin > Localization > Translate
 * everything). Without it a language only fills in screen by screen as people browse it.
 *
 * Read from the TypeScript syntax tree, not by regex:
 * - the first argument of t(), copy() and notify() when it is a plain string;
 * - copy props written as plain strings (label="…", title="…", helperText="…", …);
 * - the same keys in object literals (option lists, nav items, column definitions).
 *
 * Output: exyconn-portal/server/src/modules/i18n/ui-sources.json (sorted, one entry per string).
 * Run with `pnpm i18n:extract` (also part of `pnpm codegen`).
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { createRequire } from "node:module";

const ROOT = new URL("..", import.meta.url).pathname;
// The repository root declares no TypeScript of its own; the portal server's is the one used.
const ts = createRequire(join(ROOT, "exyconn-portal/server/package.json"))(
  "typescript",
);
const OUTPUT = join(
  ROOT,
  "exyconn-portal/server/src/modules/i18n/ui-sources.json",
);

/** Where UI code lives. */
const SOURCE_DIRS = [
  "exyconn-portal/apps",
  "packages",
  "exyconn-tracker-app/src/renderer",
  "exyconn-tracker-mobile/src",
];

const SKIPPED_DIRS = new Set([
  "node_modules",
  "dist",
  "generated",
  "__tests__",
  "coverage",
  "out",
]);
const SKIPPED_FILE = /\.(test|cy|spec|stories)\.tsx?$|\.d\.ts$/;

/** Calls whose first argument is English copy. */
const COPY_CALLS = new Set(["t", "copy", "notify"]);
/** Props and object keys that hold English copy. */
const COPY_KEYS = new Set([
  "label",
  "title",
  "helperText",
  "description",
  "placeholder",
  "submitLabel",
  "confirmText",
  "cancelText",
  "message",
  "emptyMessage",
  "subtitle",
  "heading",
  "tooltip",
  "hint",
]);

/** Longer than anything a screen shows; such a literal is content, not copy. */
const MAX_LENGTH = 500;

/** Copy reads like words: a letter, and a space or a capital (not an id, a key or a URL). */
function isCopy(text) {
  const value = text.trim();
  if (value === "" || value.length > MAX_LENGTH || !/\p{L}/u.test(value)) {
    return false;
  }
  const isAddress = /^(https?:|mailto:|\/|#|\.|@)/.test(value);
  const isIdentifier = /^[\w.-]+$/.test(value) && value === value.toLowerCase();
  if (isAddress || isIdentifier) {
    return false;
  }
  return /\s/.test(value) || /^\p{Lu}/u.test(value);
}

function sourceFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    if (SKIPPED_DIRS.has(entry)) {
      continue;
    }
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      files.push(...sourceFiles(path));
    } else if (/\.tsx?$/.test(entry) && !SKIPPED_FILE.test(entry)) {
      files.push(path);
    }
  }
  return files;
}

/** The text of a plain string literal (or a template with no substitutions), else null. */
function literalText(node) {
  if (!node) {
    return null;
  }
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  if (ts.isJsxExpression(node)) {
    return literalText(node.expression);
  }
  return null;
}

function keyName(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) {
    return name.text;
  }
  return null;
}

function collect(file, found) {
  const text = readFileSync(file, "utf8");
  const kind = file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const source = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    false,
    kind,
  );
  const add = (value) => {
    if (value !== null && isCopy(value)) {
      found.add(value);
    }
  };
  const visit = (node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      if (COPY_CALLS.has(node.expression.text)) {
        add(literalText(node.arguments[0]));
      }
    } else if (
      ts.isJsxAttribute(node) &&
      COPY_KEYS.has(node.name.getText(source))
    ) {
      add(literalText(node.initializer));
    } else if (
      ts.isPropertyAssignment(node) &&
      COPY_KEYS.has(keyName(node.name))
    ) {
      add(literalText(node.initializer));
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}

const found = new Set();
let files = 0;
for (const dir of SOURCE_DIRS) {
  for (const file of sourceFiles(join(ROOT, dir))) {
    collect(file, found);
    files += 1;
  }
}
const sources = [...found].toSorted((a, b) => a.localeCompare(b, "en"));
writeFileSync(OUTPUT, `${JSON.stringify(sources, null, 2)}\n`);
console.log(
  `i18n: ${sources.length} strings from ${files} files -> ${relative(ROOT, OUTPUT)}`,
);
