#!/usr/bin/env node
/**
 * Joins the report sections into one markdown body, writes it to the job summary, and keeps ONE
 * comment on each open pull request for this commit up to date with it (found again by the
 * marker, so a push edits the comment rather than adding another).
 *
 * The comment needs GITHUB_TOKEN with `pull-requests: write`. A pull request from a fork gets a
 * read-only token: the summary is still written and the comment is skipped with a warning.
 */
import {
  appendFileSync,
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { REPORT_DIR } from "./lib.mjs";

const MARKER = "<!-- exyconn-pr-report -->";

const sections = existsSync(REPORT_DIR)
  ? readdirSync(REPORT_DIR)
      .filter((name) => /^\d-.*\.md$/.test(name))
      .toSorted((a, b) => a.localeCompare(b))
      .map((name) => readFileSync(join(REPORT_DIR, name), "utf8"))
  : [];

const commit = (process.env.GITHUB_SHA ?? "").slice(0, 7);
const commitLabel = commit ? ` · \`${commit}\`` : "";
const run = process.env.GITHUB_RUN_ID
  ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
  : "";

const body = [
  MARKER,
  `# 📋 Quality report${commitLabel}`,
  "",
  ...(sections.length > 0
    ? sections
    : ["⚠️ No report sections were produced."]),
  run ? `\n<sub>[Full logs and artifacts](${run})</sub>` : "",
].join("\n");

writeFileSync(join(REPORT_DIR, "pr-report.md"), body);
console.log(body);
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, body);
}

const api = `${process.env.GITHUB_API_URL ?? "https://api.github.com"}/repos/${process.env.GITHUB_REPOSITORY}`;

async function github(path, init = {}) {
  const response = await fetch(`${api}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(
      `${init.method ?? "GET"} ${path} → ${response.status} ${await response.text()}`,
    );
  }
  return response.json();
}

/** The pull request this run is for, or — on a push — every open one whose head is this commit. */
async function pullRequestNumbers() {
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
  if (event.pull_request) {
    return [event.pull_request.number];
  }
  const pulls = await github(`/commits/${process.env.GITHUB_SHA}/pulls`);
  return pulls
    .filter((pull) => pull.state === "open")
    .map((pull) => pull.number);
}

async function upsertComment(number) {
  const comments = await github(`/issues/${number}/comments?per_page=100`);
  const existing = comments.find((comment) => comment.body?.startsWith(MARKER));
  if (existing) {
    await github(`/issues/comments/${existing.id}`, {
      method: "PATCH",
      body: JSON.stringify({ body }),
    });
  } else {
    await github(`/issues/${number}/comments`, {
      method: "POST",
      body: JSON.stringify({ body }),
    });
  }
  console.log(`Quality report posted on #${number}.`);
}

if (process.env.GITHUB_TOKEN && process.env.GITHUB_EVENT_PATH) {
  try {
    for (const number of await pullRequestNumbers()) {
      await upsertComment(number);
    }
  } catch (error) {
    console.log(
      `::warning::Could not post the quality report on the pull request: ${error.message}`,
    );
  }
}
