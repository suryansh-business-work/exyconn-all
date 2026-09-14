#!/usr/bin/env node
/**
 * Duplication section of the PR report, from jscpd's JSON report (config: /.jscpd.json). Clones
 * touching a file this change modified are listed first — those are the ones a reviewer can act
 * on; the repository-wide figure is context.
 *
 * CHANGED_FILES: newline-separated paths changed by this PR or push (set by the workflow).
 */
import { readFileSync } from "node:fs";
import { cell, formatPercent, writeSection } from "./lib.mjs";

const MAX_ROWS = 20;

const report = JSON.parse(
  readFileSync("reports/jscpd/jscpd-report.json", "utf8"),
);
const stats = report.statistics.total;
const changed = new Set(
  (process.env.CHANGED_FILES ?? "").split("\n").filter(Boolean),
);

const location = (file) => `\`${file.name}:${file.start}-${file.end}\``;
const touched = report.duplicates.filter(
  (clone) =>
    changed.has(clone.firstFile.name) || changed.has(clone.secondFile.name),
);

const lines = [
  "## 🧬 Code duplication",
  "",
  `Repository: **${formatPercent(stats.percentage)}** of lines duplicated — ${stats.clones} clones, ${stats.duplicatedLines} of ${stats.lines} lines in ${stats.sources} files.`,
  "",
];

if (touched.length === 0) {
  lines.push(
    `✅ No duplicated blocks in the ${changed.size} file(s) this change touches.`,
  );
} else {
  lines.push(
    `⚠️ **${touched.length}** duplicated block(s) involve files this change touches — consider a shared module:`,
    "",
    "| Lines | Here | Also in |",
    "| ---: | --- | --- |",
    ...touched
      .toSorted((a, b) => b.lines - a.lines)
      .slice(0, MAX_ROWS)
      .map(
        (clone) =>
          `| ${clone.lines} | ${cell(location(clone.firstFile))} | ${cell(location(clone.secondFile))} |`,
      ),
  );
  if (touched.length > MAX_ROWS) {
    lines.push(
      "",
      `…and ${touched.length - MAX_ROWS} more in the jscpd artifact.`,
    );
  }
}

writeSection("3-duplication", lines.join("\n"));
