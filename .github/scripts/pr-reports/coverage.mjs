#!/usr/bin/env node
/**
 * Coverage section of the PR report, from the `coverage/coverage-summary.json` every package's
 * unit tests write in CI (vitest and jest both emit the istanbul json-summary format).
 */
import { readFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  findFiles,
  formatPercent,
  packageNameFor,
  percent,
  writeSection,
} from "./lib.mjs";

const METRICS = ["lines", "statements", "functions", "branches"];

function badge(value) {
  if (value >= 80) {
    return "🟢";
  }
  return value >= 50 ? "🟡" : "🔴";
}

function metricCell(metric) {
  const value = percent(metric.covered, metric.total);
  return `${badge(value)} ${formatPercent(value)}`;
}

const packages = findFiles("coverage/coverage-summary.json").map((file) => ({
  name: packageNameFor(dirname(dirname(file))),
  total: JSON.parse(readFileSync(file, "utf8")).total,
}));

const overall = Object.fromEntries(
  METRICS.map((metric) => [
    metric,
    packages.reduce(
      (sum, p) => ({
        covered: sum.covered + p.total[metric].covered,
        total: sum.total + p.total[metric].total,
      }),
      { covered: 0, total: 0 },
    ),
  ]),
);

const lines = ["## 🧪 Test coverage", ""];
if (packages.length === 0) {
  lines.push(
    "⚠️ No coverage summaries were found — the unit-test step did not run.",
  );
} else {
  lines.push(
    `Across **${packages.length}** packages: lines **${metricCell(overall.lines)}** · statements **${metricCell(overall.statements)}** · functions **${metricCell(overall.functions)}** · branches **${metricCell(overall.branches)}**`,
    "",
    "<details><summary>Per package</summary>",
    "",
    "| Package | Lines | Statements | Functions | Branches |",
    "| --- | ---: | ---: | ---: | ---: |",
    ...packages
      .toSorted((a, b) => a.name.localeCompare(b.name))
      .map(
        (p) =>
          `| ${p.name} | ${METRICS.map((metric) => metricCell(p.total[metric])).join(" | ")} |`,
      ),
    "",
    "</details>",
    "",
    "🟢 ≥ 80% · 🟡 ≥ 50% · 🔴 < 50%",
  );
}

writeSection("2-coverage", lines.join("\n"));
