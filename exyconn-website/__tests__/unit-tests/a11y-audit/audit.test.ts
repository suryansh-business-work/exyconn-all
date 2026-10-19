/**
 * The audit's steps against a stand-in browser: options and their defaults, what each page run
 * asks Chrome to do, which focus stops count as problems, the summary tables, and the exit code
 * `main` hands back for a clean and a failing site.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fs = vi.hoisted(() => ({
  readFile: vi.fn(),
  mkdir: vi.fn(),
  writeFile: vi.fn(),
}));
const browser = vi.hoisted(() => ({ launchBrowser: vi.fn() }));
vi.mock("node:fs/promises", () => fs);
vi.mock("node:timers/promises", () => ({ setTimeout: vi.fn(async () => undefined) }));
vi.mock("node:module", () => ({
  createRequire: () => ({ resolve: (id: string) => `/ui/node_modules/${id}` }),
}));
vi.mock("../../../scripts/a11y-audit/cdp.mjs", () => browser);

import {
  AXE_TAGS,
  auditOne,
  main,
  parseOptions,
  prepare,
  reflow,
  setupScript,
  summarise,
  tabThrough,
} from "../../../scripts/a11y-audit/audit.mjs";

interface Snapshot {
  el: string;
  indicator: boolean;
  obscured: boolean;
}

const CHECKS = {
  horizontalScroll: false,
  overflowing: ["div.wide"],
  smallTargets: [{ el: "a", size: "10x10" }],
  icons: [{ hidden: true }, { hidden: false }],
};
const AXE = {
  violations: [
    {
      id: "color-contrast",
      impact: "serious",
      help: "Contrast",
      nodes: [
        { target: ["main", "p"], failureSummary: "Fix contrast" },
        { target: ["footer"], failureSummary: "Fix it" },
      ],
    },
  ],
};

/** A page whose evaluations answer by what the expression runs. */
function fakePage(snapshots: (Snapshot | null)[] = [], axe = AXE) {
  const queue = [...snapshots];
  return {
    call: vi.fn(async (_method: string, _params?: unknown) => ({})),
    goto: vi.fn(async () => undefined),
    close: vi.fn(async () => undefined),
    evaluate: vi.fn(async (expression: string) => {
      if (expression.includes("axe.run")) {
        return axe;
      }
      if (expression.includes("function inPageChecks")) {
        return CHECKS;
      }
      if (expression.includes("function focusSnapshot")) {
        return queue.shift() ?? null;
      }
      return undefined;
    }),
  };
}
type Page = ReturnType<typeof fakePage>;

const fakeBrowser = (page: Page) => ({
  openPage: vi.fn(async () => page),
  close: vi.fn(async () => undefined),
});

const RUN = { base: "http://site", setup: "setup()", axeSource: "/*axe*/", tabs: 3 };
const DESKTOP = { name: "desktop", width: 1280, height: 900, mobile: false };
const MOBILE = { name: "mobile", width: 375, height: 812, mobile: true };

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(console, "table").mockImplementation(() => undefined);
});
afterEach(() => vi.clearAllMocks());

describe("options", () => {
  it("defaults to the local server, the report folder and 60 tab stops", () => {
    expect(parseOptions([])).toEqual({
      base: "http://127.0.0.1:4000",
      out: "a11y-report",
      tabs: "60",
      "cookie-drawer": false,
    });
  });

  it("reads every flag", () => {
    expect(
      parseOptions([
        "--base",
        "https://exyconn.com",
        "--out",
        "out",
        "--pages",
        "p.json",
        "--only",
        "/de",
        "--tabs",
        "5",
        "--cookie-drawer",
      ])
    ).toEqual({
      base: "https://exyconn.com",
      out: "out",
      pages: "p.json",
      only: "/de",
      tabs: "5",
      "cookie-drawer": true,
    });
  });

  it("rejects a flag it does not know", () => {
    expect(() => parseOptions(["--nope"])).toThrow();
  });

  it("pre-accepts cookies unless the drawer itself is audited", () => {
    expect(setupScript(false)).toContain('localStorage.setItem("cookieConsent", "audit")');
    expect(setupScript(true)).toBe("");
  });
});

describe("page steps", () => {
  it("emulates the viewport, the colour scheme and reduced motion", async () => {
    const page = fakePage();
    await prepare(page, MOBILE, "dark");
    expect(page.call).toHaveBeenCalledWith("Emulation.setDeviceMetricsOverride", {
      width: 375,
      height: 812,
      deviceScaleFactor: 1,
      mobile: true,
    });
    expect(page.call).toHaveBeenCalledWith("Emulation.setEmulatedMedia", {
      features: [
        { name: "prefers-color-scheme", value: "dark" },
        { name: "prefers-reduced-motion", value: "reduce" },
      ],
    });
  });

  it("keeps only the focus stops that cannot be seen or are covered", async () => {
    const hidden = { el: "a", indicator: false, obscured: false };
    const covered = { el: "b", indicator: true, obscured: true };
    const fine = { el: "c", indicator: true, obscured: false };
    const page = fakePage([hidden, null, covered, fine]);
    expect(await tabThrough(page, 4)).toEqual([hidden, covered]);
    const keys = page.call.mock.calls.filter(([method]) => method === "Input.dispatchKeyEvent");
    expect(keys).toHaveLength(8);
    expect(keys[0]).toEqual([
      "Input.dispatchKeyEvent",
      { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 },
    ]);
    expect(keys[1][1]).toMatchObject({ type: "keyUp" });
  });

  it("audits a desktop page with axe, the in-page checks and a keyboard pass", async () => {
    const page = fakePage([{ el: "a", indicator: false, obscured: false }]);
    const chrome = fakeBrowser(page);
    const result = await auditOne(chrome, RUN, "/en-us", DESKTOP, "light");
    expect(chrome.openPage).toHaveBeenCalledWith("setup()");
    expect(page.goto).toHaveBeenCalledWith("http://site/en-us");
    const axeCall = page.evaluate.mock.calls.find(([e]) => e.includes("axe.run"));
    expect(axeCall?.[0]).toContain("/*axe*/;");
    expect(axeCall?.[0]).toContain(JSON.stringify(AXE_TAGS));
    expect(result).toEqual({
      path: "/en-us",
      viewport: "desktop",
      theme: "light",
      violations: [
        {
          id: "color-contrast",
          impact: "serious",
          help: "Contrast",
          nodes: [
            { target: "main p", summary: "Fix contrast" },
            { target: "footer", summary: "Fix it" },
          ],
        },
      ],
      checks: CHECKS,
      focusProblems: [{ el: "a", indicator: false, obscured: false }],
    });
    expect(page.close).toHaveBeenCalledTimes(1);
  });

  it("skips the keyboard pass on a phone", async () => {
    const page = fakePage([{ el: "a", indicator: false, obscured: false }]);
    const result = await auditOne(fakeBrowser(page), RUN, "/", MOBILE, "dark");
    expect(result.focusProblems).toEqual([]);
    expect(page.call).not.toHaveBeenCalledWith("Input.dispatchKeyEvent", expect.anything());
  });

  it("closes the tab even when the page fails to load", async () => {
    const page = fakePage();
    page.goto.mockRejectedValueOnce(new Error("net::ERR_CONNECTION_REFUSED"));
    await expect(auditOne(fakeBrowser(page), RUN, "/", DESKTOP, "light")).rejects.toThrow(
      "ERR_CONNECTION_REFUSED"
    );
    expect(page.close).toHaveBeenCalledTimes(1);
  });

  it("checks reflow at 320px and closes the tab", async () => {
    const page = fakePage();
    expect(await reflow(fakeBrowser(page), RUN, "/blog")).toEqual({
      path: "/blog",
      horizontalScroll: false,
      overflowing: ["div.wide"],
    });
    expect(page.call).toHaveBeenCalledWith(
      "Emulation.setDeviceMetricsOverride",
      expect.objectContaining({ width: 320, height: 640, mobile: true })
    );
    page.goto.mockRejectedValueOnce(new Error("down"));
    await expect(reflow(fakeBrowser(page), RUN, "/blog")).rejects.toThrow("down");
    expect(page.close).toHaveBeenCalledTimes(2);
  });
});

describe("summary", () => {
  it("counts violation nodes, small targets, announced icons and focus problems", () => {
    const { rows, reflowRows, total } = summarise(
      [
        {
          path: "/a",
          viewport: "desktop",
          theme: "dark",
          violations: [
            { id: "x", nodes: [{}, {}] },
            { id: "y", nodes: [{}] },
          ],
          checks: CHECKS,
          focusProblems: [{}],
        },
      ],
      [{ path: "/a", horizontalScroll: true, overflowing: ["p", "div"] }]
    );
    expect(rows).toEqual([
      {
        page: "/a",
        view: "desktop/dark",
        axe: 3,
        rules: "x,y",
        smallTargets: 1,
        announcedIcons: 1,
        focus: 1,
      },
    ]);
    expect(reflowRows).toEqual([{ page: "/a", scroll320: true, overflowing: 2 }]);
    expect(total).toBe(3);
  });
});

describe("main", () => {
  const readFiles = (pages: string[]) =>
    fs.readFile.mockImplementation(async (file: string | URL) =>
      String(file).endsWith("axe.min.js") ? "/*axe*/" : JSON.stringify(pages)
    );

  it("audits every listed page in both viewports and themes, then writes the report", async () => {
    readFiles(["/en-us", "/de-de"]);
    const page = fakePage([], { violations: [] });
    const chrome = fakeBrowser(page);
    browser.launchBrowser.mockResolvedValue(chrome);
    expect(await main(["--base", "http://site", "--out", "report", "--tabs", "0"])).toBe(0);
    expect(fs.readFile).toHaveBeenCalledWith("/ui/node_modules/axe-core/axe.min.js", "utf8");
    // Four runs and one reflow per page.
    expect(chrome.openPage).toHaveBeenCalledTimes(10);
    expect(page.goto).toHaveBeenCalledWith("http://site/de-de");
    expect(chrome.close).toHaveBeenCalledTimes(1);
    expect(fs.mkdir).toHaveBeenCalledWith("report", { recursive: true });
    const [file, body] = fs.writeFile.mock.calls[0];
    expect(file).toBe("report/results.json");
    const written = JSON.parse(body);
    expect(written.results).toHaveLength(8);
    expect(written.reflows).toHaveLength(2);
    expect(console.log).toHaveBeenCalledWith("audited /de-de");
    expect(console.log).toHaveBeenCalledWith("axe violation nodes: 0");
  });

  it("filters the pages with --only, reads --pages, and fails on any violation", async () => {
    readFiles(["/en-us", "/de-de", "/de-de/contact"]);
    const chrome = fakeBrowser(fakePage());
    browser.launchBrowser.mockResolvedValue(chrome);
    expect(await main(["--pages", "custom.json", "--only", "/de-de", "--cookie-drawer"])).toBe(1);
    expect(fs.readFile).toHaveBeenCalledWith("custom.json", "utf8");
    expect(chrome.openPage).toHaveBeenCalledTimes(10);
    expect(chrome.openPage).toHaveBeenCalledWith("");
    expect(console.log).toHaveBeenCalledWith("axe violation nodes: 16");
  });

  it("reads the bundled page list by default and closes Chrome when a run fails", async () => {
    readFiles(["/en-us"]);
    const page = fakePage();
    page.goto.mockRejectedValue(new Error("down"));
    const chrome = fakeBrowser(page);
    browser.launchBrowser.mockResolvedValue(chrome);
    await expect(main([])).rejects.toThrow("down");
    const pagesFile = fs.readFile.mock.calls[1][0];
    expect(String(pagesFile)).toMatch(/scripts\/a11y-audit\/pages\.json$/);
    expect(chrome.close).toHaveBeenCalledTimes(1);
    expect(fs.writeFile).not.toHaveBeenCalled();
  });
});
