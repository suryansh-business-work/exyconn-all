/**
 * WCAG 2.2 AA audit of a running website: axe-core plus the checks in page-checks.mjs, for
 * every page in pages.json, in light and dark, at phone and desktop widths, and a 320px
 * reflow pass.
 *
 *   pnpm run build && node dist/server/entry.mjs      # or `pnpm dev`
 *   pnpm run a11y:audit -- --base http://127.0.0.1:4000 --out ./a11y-report
 *
 * axe-core is not a dependency of this package; it is read from the workspace's
 * `@exyconn/ui` install (which ships it for the portal's Cypress checks).
 * Point CHROME_PATH at a Chrome binary off macOS.
 */
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { setTimeout as delay } from "node:timers/promises";
import { launchBrowser } from "./cdp.mjs";
import { focusSnapshot, inPageChecks } from "./page-checks.mjs";

const { values } = parseArgs({
  options: {
    base: { type: "string", default: "http://127.0.0.1:4000" },
    out: { type: "string", default: "a11y-report" },
    pages: { type: "string" },
    only: { type: "string" },
    tabs: { type: "string", default: "60" },
    "cookie-drawer": { type: "boolean", default: false },
  },
});

const requireFromUi = createRequire(
  new URL("../../../exyconn-portal/ui/package.json", import.meta.url)
);
const axeSource = await readFile(requireFromUi.resolve("axe-core/axe.min.js"), "utf8");
const pagesFile = values.pages ?? new URL("./pages.json", import.meta.url);
const pages = JSON.parse(await readFile(pagesFile, "utf8")).filter(
  (path) => !values.only || path.includes(values.only)
);

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812, mobile: true },
  { name: "desktop", width: 1280, height: 900, mobile: false },
];
const THEMES = ["light", "dark"];
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
/*
 * A first visit opens the cookie drawer over the page, and axe skips (marks "incomplete")
 * everything under its backdrop. The drawer is audited on its own with `--cookie-drawer`.
 */
const SETUP = values["cookie-drawer"]
  ? ""
  : 'try { localStorage.setItem("cookieConsent", "audit"); } catch {}';

async function prepare(page, viewport, theme) {
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

async function settle(page) {
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

async function tabThrough(page, count) {
  const stops = [];
  for (let index = 0; index < count; index += 1) {
    await page.call("Input.dispatchKeyEvent", {
      type: "keyDown",
      key: "Tab",
      code: "Tab",
      windowsVirtualKeyCode: 9,
    });
    await page.call("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "Tab",
      code: "Tab",
      windowsVirtualKeyCode: 9,
    });
    const snapshot = await page.evaluate(`(${focusSnapshot})()`);
    if (snapshot) {
      stops.push(snapshot);
    }
  }
  return stops.filter((stop) => !stop.indicator || stop.obscured);
}

async function auditOne(browser, path, viewport, theme) {
  const page = await browser.openPage(SETUP);
  try {
    await prepare(page, viewport, theme);
    await page.goto(values.base + path);
    await settle(page);
    // Injected and run in one evaluation, so a late client-side render cannot drop axe between them.
    const axe = await page.evaluate(
      `${axeSource};\naxe.run(document, { runOnly: { type: "tag", values: ${JSON.stringify(AXE_TAGS)} }, resultTypes: ["violations"] })`
    );
    const checks = await page.evaluate(`(${inPageChecks})()`);
    const focusProblems = viewport.mobile ? [] : await tabThrough(page, Number(values.tabs));
    return {
      path,
      viewport: viewport.name,
      theme,
      violations: axe.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.map((node) => ({
          target: node.target.join(" "),
          summary: node.failureSummary,
        })),
      })),
      checks,
      focusProblems,
    };
  } finally {
    await page.close();
  }
}

async function reflow(browser, path) {
  const page = await browser.openPage(SETUP);
  try {
    await prepare(page, { width: 320, height: 640, mobile: true }, "light");
    await page.goto(values.base + path);
    await settle(page);
    const { horizontalScroll, overflowing } = await page.evaluate(`(${inPageChecks})()`);
    return { path, horizontalScroll, overflowing };
  } finally {
    await page.close();
  }
}

const browser = await launchBrowser();
const results = [];
const reflows = [];
try {
  for (const path of pages) {
    const runs = VIEWPORTS.flatMap((viewport) =>
      THEMES.map((theme) => auditOne(browser, path, viewport, theme))
    );
    results.push(...(await Promise.all(runs)));
    reflows.push(await reflow(browser, path));
    console.log(`audited ${path}`);
  }
} finally {
  await browser.close();
}

await mkdir(values.out, { recursive: true });
await writeFile(join(values.out, "results.json"), JSON.stringify({ results, reflows }, null, 2));

const rows = results.map((r) => ({
  page: r.path,
  view: `${r.viewport}/${r.theme}`,
  axe: r.violations.reduce((sum, v) => sum + v.nodes.length, 0),
  rules: r.violations.map((v) => v.id).join(","),
  smallTargets: r.checks.smallTargets.length,
  announcedIcons: r.checks.icons.filter((icon) => !icon.hidden).length,
  focus: r.focusProblems.length,
}));
console.table(rows);
console.table(
  reflows.map((r) => ({
    page: r.path,
    scroll320: r.horizontalScroll,
    overflowing: r.overflowing.length,
  }))
);
const total = rows.reduce((sum, row) => sum + row.axe, 0);
console.log(`axe violation nodes: ${total}`);
process.exitCode = total > 0 ? 1 : 0;
