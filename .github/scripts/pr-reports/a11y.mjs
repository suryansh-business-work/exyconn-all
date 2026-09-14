#!/usr/bin/env node
/**
 * Accessibility section of the PR report, from the `cypress/a11y/report.jsonl` files the shared
 * Cypress support writes: axe (WCAG 2.0, 2.1 and 2.2 A + AA) after every component test and on
 * every end-to-end page.
 */
import { readFileSync } from "node:fs";
import { dirname } from "node:path";
import { cell, findFiles, packageNameFor, writeSection } from "./lib.mjs";

const IMPACT_ORDER = ["critical", "serious", "moderate", "minor"];
const MAX_VIOLATION_ROWS = 25;

function readEntries(file) {
  return readFileSync(file, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function summarisePackage(file) {
  const tests = new Set();
  const specs = new Set();
  const violations = [];
  for (const entry of readEntries(file)) {
    tests.add(`${entry.spec}::${entry.test}`);
    specs.add(entry.spec);
    for (const violation of entry.violations) {
      violations.push({ ...violation, spec: entry.spec, test: entry.test });
    }
  }
  return {
    name: packageNameFor(dirname(dirname(dirname(file)))),
    tests: tests.size,
    specs: specs.size,
    violations,
  };
}

function violationCount(count) {
  return count === 0 ? "✅ 0" : `❌ ${count}`;
}

function violationRows(violations) {
  const byRule = new Map();
  for (const violation of violations) {
    const row = byRule.get(violation.id) ?? { ...violation, count: 0 };
    row.count += violation.nodes.length;
    byRule.set(violation.id, row);
  }
  return [...byRule.values()]
    .toSorted(
      (a, b) =>
        IMPACT_ORDER.indexOf(a.impact) - IMPACT_ORDER.indexOf(b.impact) ||
        b.count - a.count,
    )
    .slice(0, MAX_VIOLATION_ROWS)
    .map((row) => {
      const seenIn = cell(`${row.spec} › ${row.test}`);
      return `| \`${row.id}\` | ${row.impact ?? "n/a"} | ${row.count} | ${cell(row.help)} | ${seenIn} |`;
    });
}

const packages = findFiles("cypress/a11y/report.jsonl").map(summarisePackage);
const tests = packages.reduce((sum, p) => sum + p.tests, 0);
const specs = packages.reduce((sum, p) => sum + p.specs, 0);
const violations = packages.flatMap((p) => p.violations);

const lines = ["## ♿ Accessibility — WCAG 2.2 AA", ""];
if (packages.length === 0) {
  lines.push(
    "⚠️ No axe results were recorded — the Cypress job did not run or did not reach its tests.",
  );
} else {
  const status =
    violations.length === 0
      ? "✅ **No violations**"
      : `❌ **${violations.length} violation(s)**`;
  lines.push(
    `${status} — axe checked **${tests}** rendered states in **${specs}** specs across **${packages.length}** packages (WCAG 2.0 / 2.1 / 2.2, levels A and AA, contrast measured in a real browser).`,
    "",
  );
  if (violations.length > 0) {
    lines.push(
      "| Rule | Impact | Elements | What it means | First seen in |",
      "| --- | --- | ---: | --- | --- |",
      ...violationRows(violations),
      "",
    );
  }
  lines.push(
    "<details><summary>Per package</summary>",
    "",
    "| Package | Specs | States checked | Violations |",
    "| --- | ---: | ---: | ---: |",
    ...packages.map(
      (p) =>
        `| ${p.name} | ${p.specs} | ${p.tests} | ${violationCount(p.violations.length)} |`,
    ),
    "",
    "</details>",
  );
}

writeSection("1-a11y", lines.join("\n"));
