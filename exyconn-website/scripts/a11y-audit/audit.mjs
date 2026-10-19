/**
 * The audit itself (see index.mjs for how to run it): options, per-page runs and the summary.
 * Kept apart from the CLI entry so each step can be exercised against a stand-in browser.
 */
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { setTimeout as delay } from "node:timers/promises";
import { launchBrowser } from "./cdp.mjs";
import { focusSnapshot, inPageChecks } from "./page-checks.mjs";

export const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812, mobile: true },
  { name: "desktop", width: 1280, height: 900, mobile: false },
];
export const THEMES = ["light", "dark"];
export const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** The command-line options, with their defaults. */
export function parseOptions(args) {
  return parseArgs({
    args,
    options: {
      base: { type: "string", default: "http://127.0.0.1:4000" },
      out: { type: "string", default: "a11y-report" },
      pages: { type: "string" },
      only: { type: "string" },
      tabs: { type: "string", default: "60" },
      "cookie-drawer": { type: "boolean", default: false },
    },
  }).values;
}

/*
 * A first visit opens the cookie drawer over the page, and axe skips (marks "incomplete")
 * everything under its backdrop. The drawer is audited on its own with `--cookie-drawer`.
 */
export const setupScript = (cookieDrawer) =>
  cookieDrawer ? "" : 'try { localStorage.setItem("cookieConsent", "audit"); } catch {}';

export async function prepare(page, viewport, theme) {
  await page.call("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.mobile,
  });
  await page.call("Emulation.setEmulatedMedia", {
    features: [
      { name: "prefers-color-scheme", value: theme },
      { name: "prefers-reduced-motion", value: "reduce" },
    ],
  });
}

export async function settle(page) {
  await delay(800);
  await page.evaluate(`(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += innerHeight) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    scrollTo(0, 0);
  })()`);
  await delay(400);
}

const TAB_KEY = { key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 };

/** Presses Tab `count` times; returns the stops whose focus cannot be seen or is covered. */
export async function tabThrough(page, count) {
  const stops = [];
  for (let index = 0; index < count; index += 1) {
    await page.call("Input.dispatchKeyEvent", { type: "keyDown", ...TAB_KEY });
    await page.call("Input.dispatchKeyEvent", { type: "keyUp", ...TAB_KEY });
    const snapshot = await page.evaluate(`(${focusSnapshot})()`);
    if (snapshot) {
      stops.push(snapshot);
    }
  }
  return stops.filter((stop) => !stop.indicator || stop.obscured);
}

const violationsOf = (axe) =>
  axe.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.map((node) => ({
      target: node.target.join(" "),
      summary: node.failureSummary,
    })),
  }));

/** One page in one viewport and theme. `run` is `{ base, setup, axeSource, tabs }`. */
export async function auditOne(browser, run, path, viewport, theme) {
  const page = await browser.openPage(run.setup);
  try {
    await prepare(page, viewport, theme);
    await page.goto(run.base + path);
    await settle(page);
    // Injected and run in one evaluation, so a late client-side render cannot drop axe between them.
    const axe = await page.evaluate(
      `${run.axeSource};\naxe.run(document, { runOnly: { type: "tag", values: ${JSON.stringify(AXE_TAGS)} }, resultTypes: ["violations"] })`
    );
    const checks = await page.evaluate(`(${inPageChecks})()`);
    const focusProblems = viewport.mobile ? [] : await tabThrough(page, run.tabs);
    return {
      path,
      viewport: viewport.name,
      theme,
      violations: violationsOf(axe),
      checks,
      focusProblems,
    };
  } finally {
    await page.close();
  }
}

/** The 320px reflow pass for one page. */
export async function reflow(browser, run, path) {
  const page = await browser.openPage(run.setup);
  try {
    await prepare(page, { width: 320, height: 640, mobile: true }, "light");
    await page.goto(run.base + path);
    await settle(page);
    const { horizontalScroll, overflowing } = await page.evaluate(`(${inPageChecks})()`);
    return { path, horizontalScroll, overflowing };
  } finally {
    await page.close();
  }
}

/** The console tables and the number that decides the exit code. */
export function summarise(results, reflows) {
  const rows = results.map((r) => ({
    page: r.path,
    view: `${r.viewport}/${r.theme}`,
    axe: r.violations.reduce((sum, v) => sum + v.nodes.length, 0),
    rules: r.violations.map((v) => v.id).join(","),
    smallTargets: r.checks.smallTargets.length,
    announcedIcons: r.checks.icons.filter((icon) => !icon.hidden).length,
    focus: r.focusProblems.length,
  }));
  const reflowRows = reflows.map((r) => ({
    page: r.path,
    scroll320: r.horizontalScroll,
    overflowing: r.overflowing.length,
  }));
  return { rows, reflowRows, total: rows.reduce((sum, row) => sum + row.axe, 0) };
}

/*
 * axe-core is not a dependency of this package; it is read from the workspace's
 * `@exyconn/ui` install (which ships it for the portal's Cypress checks).
 */
async function readAxeSource() {
  const requireFromUi = createRequire(
    new URL("../../../exyconn-portal/ui/package.json", import.meta.url)
  );
  return readFile(requireFromUi.resolve("axe-core/axe.min.js"), "utf8");
}

async function readPages(values) {
  const pagesFile = values.pages ?? new URL("./pages.json", import.meta.url);
  return JSON.parse(await readFile(pagesFile, "utf8")).filter(
    (path) => !values.only || path.includes(values.only)
  );
}

/** Runs the whole audit, writes `results.json` and the tables; returns the exit code. */
export async function main(args) {
  const values = parseOptions(args);
  const run = {
    base: values.base,
    setup: setupScript(values["cookie-drawer"]),
    axeSource: await readAxeSource(),
    tabs: Number(values.tabs),
  };
  const pages = await readPages(values);

  const browser = await launchBrowser();
  const results = [];
  const reflows = [];
  try {
    for (const path of pages) {
      const runs = VIEWPORTS.flatMap((viewport) =>
        THEMES.map((theme) => auditOne(browser, run, path, viewport, theme))
      );
      results.push(...(await Promise.all(runs)));
      reflows.push(await reflow(browser, run, path));
      console.log(`audited ${path}`);
    }
  } finally {
    await browser.close();
  }

  await mkdir(values.out, { recursive: true });
  await writeFile(join(values.out, "results.json"), JSON.stringify({ results, reflows }, null, 2));

  const { rows, reflowRows, total } = summarise(results, reflows);
  console.table(rows);
  console.table(reflowRows);
  console.log(`axe violation nodes: ${total}`);
  return total > 0 ? 1 : 0;
}
