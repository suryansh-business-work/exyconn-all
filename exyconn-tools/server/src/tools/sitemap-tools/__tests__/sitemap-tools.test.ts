import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ safeRequest: vi.fn() }));
vi.mock("../../../shared/security/safe-http", () => ({
  safeRequest: mocks.safeRequest,
}));

import { mountRouter } from "../../../__tests__/helpers/mountRouter";
import routes from "../routes";
import * as services from "../services";

const app = mountRouter(routes);

/** A site answering each URL with the given body; unknown URLs reject. */
function serve(pages: Record<string, string | Error>) {
  mocks.safeRequest.mockImplementation(async (url: string) => {
    const page = pages[url];
    if (page === undefined || page instanceof Error) {
      throw page ?? new Error(`no page for ${url}`);
    }
    return { data: page };
  });
}

const entry = (loc: string, extra = "") =>
  `<url><loc>${loc}</loc>${extra}</url>`;
const urlset = (...entries: string[]) =>
  `<?xml version="1.0"?><urlset>${entries.join("")}</urlset>`;
const index = (...locs: string[]) =>
  `<sitemapindex>${locs.map((loc) => `<sitemap><loc>${loc}</loc></sitemap>`).join("")}</sitemapindex>`;

beforeEach(() => {
  mocks.safeRequest.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-10T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("validateSitemap", () => {
  it("accepts a clean sitemap and reads its fields", async () => {
    const xml = urlset(
      entry(
        "https://a.test/",
        "<lastmod>2026-10-01</lastmod><changefreq>Daily</changefreq><priority>0.8</priority>",
      ),
      entry("https://a.test/b", "<lastmod>2026-10-01T10:00:00+05:30</lastmod>"),
    );
    serve({ "https://a.test/sitemap.xml": xml });

    const result = await services.validateSitemap("https://a.test/sitemap.xml");

    expect(result).toMatchObject({
      isValid: true,
      urlCount: 2,
      issues: [],
      fileSize: Buffer.byteLength(xml),
    });
    expect(result.urls[0]).toEqual({
      loc: "https://a.test/",
      lastmod: "2026-10-01",
      changefreq: "daily",
      priority: 0.8,
    });
  });

  it("reports every problem with an entry", async () => {
    serve({
      "https://a.test/s.xml": urlset(
        "<url></url>",
        entry("not a url"),
        entry(
          "https://a.test/x",
          "<lastmod>yesterday</lastmod><changefreq>sometimes</changefreq><priority>7</priority>",
        ),
        entry("https://a.test/y", "<priority>high</priority>"),
      ),
    });

    const result = await services.validateSitemap("https://a.test/s.xml");

    expect(result.isValid).toBe(false);
    expect(result.issues).toEqual([
      { type: "error", message: "URL #1: Missing required <loc> tag" },
      { type: "error", message: "Invalid URL format", url: "not a url" },
      {
        type: "warning",
        message: "Invalid lastmod format (should be W3C date)",
        url: "https://a.test/x",
      },
      {
        type: "warning",
        message: "Invalid changefreq value: sometimes",
        url: "https://a.test/x",
      },
      {
        type: "warning",
        message: "Invalid priority (must be 0.0-1.0): 7",
        url: "https://a.test/x",
      },
      {
        type: "warning",
        message: "Invalid priority (must be 0.0-1.0): high",
        url: "https://a.test/y",
      },
    ]);
  });

  it("treats a lone <url> as one entry", async () => {
    serve({ "https://a.test/s.xml": urlset(entry("https://a.test/only")) });

    await expect(
      services.validateSitemap("https://a.test/s.xml"),
    ).resolves.toMatchObject({
      urlCount: 1,
      isValid: true,
    });
  });

  it("accepts a urlset with attributes but no URLs as valid and empty", async () => {
    serve({
      "https://a.test/s.xml":
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
    });

    await expect(
      services.validateSitemap("https://a.test/s.xml"),
    ).resolves.toMatchObject({
      isValid: true,
      urlCount: 0,
      issues: [],
    });
  });

  it("warns that an index is not a sitemap, and errors on any other document", async () => {
    serve({
      "https://a.test/index.xml": index("https://a.test/s.xml"),
      "https://a.test/other.xml": "<html><body>hi</body></html>",
    });

    const asIndex = await services.validateSitemap("https://a.test/index.xml");
    expect(asIndex).toMatchObject({ isValid: true, urlCount: 0 });
    expect(asIndex.issues).toEqual([
      { type: "warning", message: "This is a sitemap index, not a sitemap" },
    ]);

    const other = await services.validateSitemap("https://a.test/other.xml");
    expect(other.isValid).toBe(false);
    expect(other.issues).toEqual([
      { type: "error", message: "Missing <urlset> root element" },
    ]);
  });

  it("reports XML that cannot be parsed, an oversized file and more than 50,000 URLs", async () => {
    serve({ "https://a.test/bad.xml": "<urlset" });
    const bad = await services.validateSitemap("https://a.test/bad.xml");
    expect(bad).toMatchObject({ isValid: false, urlCount: 0 });
    expect(bad.issues).toEqual([
      { type: "error", message: "Invalid XML syntax" },
    ]);

    const big = urlset(
      ...Array.from({ length: 50001 }, (_, i) => entry(`https://a.test/${i}`)),
    );
    serve({ "https://a.test/big.xml": big });
    const many = await services.validateSitemap("https://a.test/big.xml");
    expect(many.issues[0]).toEqual({
      type: "error",
      message: "Sitemap has 50001 URLs, exceeds 50,000 limit",
    });
    expect(many.isValid).toBe(false);
  });

  it("flags a file over 50MB", async () => {
    serve({ "https://a.test/huge.xml": urlset(entry("https://a.test/")) });
    vi.spyOn(Buffer, "byteLength").mockReturnValueOnce(50 * 1024 * 1024 + 1);

    const result = await services.validateSitemap("https://a.test/huge.xml");

    expect(result.issues).toContainEqual({
      type: "error",
      message: "Sitemap exceeds 50MB limit",
    });
  });

  it("measures a non-string body by its JSON", async () => {
    mocks.safeRequest.mockResolvedValue({
      data: { urlset: { url: { loc: "https://a.test/" } } },
    });

    const result = await services.validateSitemap("https://a.test/s.xml");

    expect(result.fileSize).toBe(
      Buffer.byteLength('{"urlset":{"url":{"loc":"https://a.test/"}}}'),
    );
    expect(result.isValid).toBe(false);
  });

  it("reports a fetch failure as an error issue", async () => {
    serve({ "https://a.test/s.xml": new Error("ECONNREFUSED") });
    await expect(
      services.validateSitemap("https://a.test/s.xml"),
    ).resolves.toEqual({
      isValid: false,
      urlCount: 0,
      issues: [{ type: "error", message: "ECONNREFUSED" }],
      urls: [],
      fileSize: 0,
    });

    mocks.safeRequest.mockRejectedValue("weird");
    const odd = await services.validateSitemap("https://a.test/s.xml");
    expect(odd.issues[0].message).toBe("Failed to fetch sitemap");
  });
});

describe("extractSitemapUrls", () => {
  it("returns the entries of a urlset with their optional fields", async () => {
    serve({
      "https://a.test/s.xml": urlset(
        entry(
          "https://a.test/a",
          "<lastmod>2026-01-01</lastmod><changefreq>weekly</changefreq><priority>0.5</priority>",
        ),
        entry("https://a.test/b"),
        "<url></url>",
      ),
    });

    const result = await services.extractSitemapUrls("https://a.test/s.xml");

    expect(result.sitemapType).toBe("urlset");
    expect(result.urls).toEqual([
      {
        loc: "https://a.test/a",
        lastmod: "2026-01-01",
        changefreq: "weekly",
        priority: 0.5,
      },
      {
        loc: "https://a.test/b",
        lastmod: undefined,
        changefreq: undefined,
        priority: undefined,
      },
      {
        loc: "",
        lastmod: undefined,
        changefreq: undefined,
        priority: undefined,
      },
    ]);
    expect(result.totalCount).toBe(3);
  });

  it("follows an index into its children, skipping one that fails", async () => {
    serve({
      "https://a.test/index.xml": index(
        "https://a.test/1.xml",
        "https://a.test/2.xml",
      ),
      "https://a.test/1.xml": urlset(entry("https://a.test/one")),
    });

    const result = await services.extractSitemapUrls(
      "https://a.test/index.xml",
    );

    expect(result).toMatchObject({
      sitemapType: "sitemapindex",
      childSitemaps: ["https://a.test/1.xml", "https://a.test/2.xml"],
      totalCount: 1,
    });
  });

  it("lists children without fetching them when asked not to follow, and caps follow at ten", async () => {
    const children = Array.from(
      { length: 12 },
      (_, i) => `https://a.test/${i}.xml`,
    );
    serve({
      "https://a.test/index.xml": index(...children),
      ...Object.fromEntries(
        children.map((child) => [child, urlset(entry(`${child}#u`))]),
      ),
    });

    const listed = await services.extractSitemapUrls(
      "https://a.test/index.xml",
      false,
    );
    expect(listed.urls).toEqual([]);
    expect(listed.childSitemaps).toHaveLength(12);

    const followed = await services.extractSitemapUrls(
      "https://a.test/index.xml",
      true,
    );
    expect(followed.totalCount).toBe(10);
  });

  it("ignores index entries that have no location", async () => {
    serve({
      "https://a.test/index.xml":
        "<sitemapindex><sitemap></sitemap></sitemapindex>",
    });

    const result = await services.extractSitemapUrls(
      "https://a.test/index.xml",
    );

    expect(result.childSitemaps).toEqual([]);
  });

  it("refuses a document that is neither", async () => {
    serve({ "https://a.test/s.xml": "<feed></feed>" });

    await expect(
      services.extractSitemapUrls("https://a.test/s.xml"),
    ).rejects.toThrow("Invalid sitemap format");
  });
});

describe("compareSitemaps", () => {
  it("splits the URLs into added, removed, modified and unchanged", async () => {
    serve({
      "https://a.test/old.xml": urlset(
        entry("https://a.test/same", "<lastmod>2026-01-01</lastmod>"),
        entry("https://a.test/changed", "<lastmod>2026-01-01</lastmod>"),
        entry("https://a.test/gone"),
      ),
      "https://a.test/new.xml": urlset(
        entry("https://a.test/same", "<lastmod>2026-01-01</lastmod>"),
        entry("https://a.test/changed", "<lastmod>2026-02-02</lastmod>"),
        entry("https://a.test/fresh"),
      ),
    });

    const result = await services.compareSitemaps(
      "https://a.test/old.xml",
      "https://a.test/new.xml",
    );

    expect(result.added.map((u) => u.loc)).toEqual(["https://a.test/fresh"]);
    expect(result.removed.map((u) => u.loc)).toEqual(["https://a.test/gone"]);
    expect(result.modified).toEqual([
      {
        url: "https://a.test/changed",
        oldLastmod: "2026-01-01",
        newLastmod: "2026-02-02",
      },
    ]);
    expect(result.unchanged).toBe(1);
    expect(result.summary).toEqual({
      sitemap1Count: 3,
      sitemap2Count: 3,
      addedCount: 1,
      removedCount: 1,
      modifiedCount: 1,
    });
  });
});

describe("analyzeSitemapInsights", () => {
  it("summarises patterns, depth, hosts, file types, freshness and frequencies", async () => {
    serve({
      "https://a.test/s.xml": urlset(
        entry(
          "https://a.test/",
          "<priority>0.9</priority><changefreq>daily</changefreq><lastmod>2026-10-08</lastmod>",
        ),
        entry(
          "https://a.test/blog/post.html",
          "<priority>0.6</priority><lastmod>2026-09-25</lastmod>",
        ),
        entry(
          "https://a.test/blog/2/index.php",
          "<priority>0.2</priority><lastmod>2026-08-01</lastmod>",
        ),
        entry(
          "https://b.test/docs/a/b",
          "<lastmod>2026-02-01</lastmod><changefreq>daily</changefreq>",
        ),
        entry("https://b.test/old", "<lastmod>2020-01-01</lastmod>"),
        entry("not a url"),
      ),
    });

    const result = await services.analyzeSitemapInsights(
      "https://a.test/s.xml",
    );

    expect(result.totalUrls).toBe(6);
    expect(result.urlPatterns).toEqual([
      { pattern: "blog", count: 2, percentage: 33 },
      { pattern: "[root]", count: 1, percentage: 17 },
      { pattern: "docs", count: 1, percentage: 17 },
      { pattern: "old", count: 1, percentage: 17 },
    ]);
    expect(result.depthAnalysis).toEqual([
      { depth: 0, count: 1 },
      { depth: 1, count: 1 },
      { depth: 2, count: 1 },
      { depth: 3, count: 2 },
    ]);
    expect(result.domainBreakdown).toEqual([
      { domain: "a.test", count: 3 },
      { domain: "b.test", count: 2 },
    ]);
    expect(result.fileTypes).toEqual([
      { extension: "none", count: 3 },
      { extension: "html", count: 1 },
      { extension: "php", count: 1 },
    ]);
    expect(result.lastmodFreshness).toEqual([
      { category: "Last 7 days", count: 1 },
      { category: "Last 30 days", count: 1 },
      { category: "Last 90 days", count: 1 },
      { category: "Last year", count: 1 },
      { category: "Older than 1 year", count: 1 },
    ]);
    expect(result.changefreqDistribution).toEqual([
      { freq: "daily", count: 2 },
    ]);
    expect(result.priorityDistribution).toEqual([
      { range: "High (0.8-1.0)", count: 1 },
      { range: "Medium (0.5-0.7)", count: 1 },
      { range: "Low (0.0-0.4)", count: 1 },
    ]);
  });
});

describe("generators", () => {
  it("writes a sitemap with defaults filled in and lastmod from today when missing", () => {
    const xml = services.generateSitemap({
      urls: [
        {
          loc: "https://a.test/",
          lastmod: "2026-01-01",
          changefreq: "weekly",
          priority: 0.9,
        },
        { loc: "https://a.test/b" },
      ],
      defaultChangefreq: "monthly",
      defaultPriority: 0.4,
    });

    expect(xml).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    );
    expect(xml).toContain("<lastmod>2026-01-01</lastmod>");
    expect(xml).toContain("<changefreq>weekly</changefreq>");
    expect(xml).toContain("<lastmod>2026-10-10</lastmod>");
    expect(xml).toContain("<changefreq>monthly</changefreq>");
    expect(xml).toContain("<priority>0.4</priority>");
    expect(xml).toContain("<priority>0.9</priority>");
  });

  it("leaves lastmod, changefreq and priority out when not wanted", () => {
    const xml = services.generateSitemap({
      urls: [{ loc: "https://a.test/", lastmod: "2026-01-01" }],
      includeLastmod: false,
    });

    expect(xml).toContain("<loc>https://a.test/</loc>");
    expect(xml).not.toContain("lastmod");
    expect(xml).not.toContain("changefreq");
    expect(xml).not.toContain("priority");
  });

  it("writes a sitemap index with today's date for entries without one", () => {
    const xml = services.generateSitemapIndex({
      sitemaps: [
        { loc: "https://a.test/1.xml", lastmod: "2026-03-03" },
        { loc: "https://a.test/2.xml" },
      ],
    });

    expect(xml).toContain("<sitemapindex");
    expect(xml).toContain("<lastmod>2026-03-03</lastmod>");
    expect(xml).toContain("<lastmod>2026-10-10</lastmod>");
  });

  it("writes robots.txt rules, crawl delay and sitemaps", () => {
    const text = services.generateRobotsTxt({
      sitemaps: ["https://a.test/sitemap.xml"],
      userAgentRules: [
        { userAgent: "*", disallow: ["/admin"], allow: ["/admin/public"] },
      ],
      crawlDelay: 5,
    });

    expect(text).toBe(
      "User-agent: *\nDisallow: /admin\nAllow: /admin/public\nCrawl-delay: 5\n\nSitemap: https://a.test/sitemap.xml",
    );
    expect(
      services.generateRobotsTxt({
        sitemaps: [],
        userAgentRules: [{ userAgent: "Bot", disallow: [], allow: [] }],
      }),
    ).toBe("User-agent: Bot\n");
  });

  it("splits a sitemap into files of a given size and indexes them", async () => {
    serve({
      "https://a.test/s.xml": urlset(
        ...Array.from({ length: 5 }, (_, i) => entry(`https://a.test/${i}`)),
      ),
    });

    const result = await services.splitSitemap(
      "https://a.test/s.xml",
      2,
      "part",
    );

    expect(result.totalUrls).toBe(5);
    expect(result.sitemaps.map((s) => [s.index, s.urlCount])).toEqual([
      [1, 2],
      [2, 2],
      [3, 1],
    ]);
    expect(result.indexFile).toContain("<loc>part-1.xml</loc>");
    expect(result.indexFile).toContain("<loc>part-3.xml</loc>");
  });

  it("splits with the default size and name", async () => {
    serve({ "https://a.test/s.xml": urlset(entry("https://a.test/1")) });

    const result = await services.splitSitemap("https://a.test/s.xml");

    expect(result.sitemaps).toHaveLength(1);
    expect(result.indexFile).toContain("<loc>sitemap-1.xml</loc>");
  });
});

describe("analyzeFrequency", () => {
  it("counts changefreq and priority use, with recommendations", async () => {
    serve({
      "https://a.test/s.xml": urlset(
        entry(
          "https://a.test/1",
          "<changefreq>daily</changefreq><priority>0.9</priority>",
        ),
        entry(
          "https://a.test/2",
          "<changefreq>daily</changefreq><priority>0.7</priority>",
        ),
        entry(
          "https://a.test/3",
          "<changefreq>custom</changefreq><priority>0.1</priority>",
        ),
        entry("https://a.test/4", "<priority>0.8</priority>"),
      ),
    });

    const result = await services.analyzeFrequency("https://a.test/s.xml");

    expect(result.changefreqStats).toEqual([
      {
        freq: "daily",
        count: 2,
        percentage: 50,
        recommendation: "Standard for blogs, active content",
      },
      { freq: "custom", count: 1, percentage: 25, recommendation: undefined },
    ]);
    expect(result.priorityStats).toEqual([
      { range: "High (0.8-1.0)", count: 2, percentage: 50, avgPriority: 0.85 },
      { range: "Medium (0.5-0.7)", count: 1, percentage: 25, avgPriority: 0.7 },
      { range: "Low (0.0-0.4)", count: 1, percentage: 25, avgPriority: 0.1 },
    ]);
    expect(result.urlsWithoutChangefreq).toBe(1);
    expect(result.urlsWithoutPriority).toBe(0);
    expect(result.recommendations).toEqual([]);
  });

  it("recommends adding the tags when most URLs lack them", async () => {
    serve({
      "https://a.test/s.xml": urlset(
        entry("https://a.test/1"),
        entry("https://a.test/2"),
      ),
    });

    const result = await services.analyzeFrequency("https://a.test/s.xml");

    expect(result.recommendations).toEqual([
      "Over 50% of URLs lack changefreq - consider adding for better crawl optimization",
      "Over 50% of URLs lack priority - consider adding to help search engines prioritize",
    ]);
  });
});

describe("routes", () => {
  const SITEMAP = urlset(
    entry(
      "https://a.test/1",
      "<priority>0.5</priority><changefreq>daily</changefreq>",
    ),
  );
  const post = (path: string, body: object) =>
    request(app).post(path).send(body);

  it.each([
    ["/validate", { url: "https://a.test/s.xml" }, "isValid"],
    [
      "/extract-urls",
      { url: "https://a.test/s.xml", followIndex: false },
      "urls",
    ],
    [
      "/compare",
      {
        sitemap1Url: "https://a.test/s.xml",
        sitemap2Url: "https://a.test/s.xml",
      },
      "added",
    ],
    ["/insights", { url: "https://a.test/s.xml" }, "totalUrls"],
    ["/split", { url: "https://a.test/s.xml", urlsPerFile: 100 }, "sitemaps"],
    ["/frequency", { url: "https://a.test/s.xml" }, "changefreqStats"],
  ])("POST %s answers with its analysis", async (path, body, key) => {
    serve({ "https://a.test/s.xml": SITEMAP });

    const res = await post(path, body);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty(key);
  });

  it.each(["/extract-urls", "/compare", "/insights", "/split", "/frequency"])(
    "POST %s answers 500 with the reason when the sitemap is not valid",
    async (path) => {
      serve({ "https://a.test/s.xml": "<feed></feed>" });

      const res = await post(path, {
        url: "https://a.test/s.xml",
        sitemap1Url: "https://a.test/s.xml",
        sitemap2Url: "https://a.test/s.xml",
      });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Invalid sitemap format");
    },
  );

  it("POST /validate answers 500 with a fixed message for an unexpected failure", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { validateSitemapController } = await import("../controllers.js");
    const json = vi
      .fn()
      .mockImplementationOnce(() => {
        throw new Error("secret");
      })
      .mockReturnValue(undefined);
    const res = { json, status: vi.fn().mockReturnThis() };
    serve({ "https://a.test/s.xml": SITEMAP });

    await validateSitemapController(
      { body: { url: "https://a.test/s.xml" } } as never,
      res as never,
    );
    vi.unstubAllEnvs();

    expect(res.status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenLastCalledWith({ error: "Validation failed" });
  });

  it("generates a sitemap, an index and robots.txt", async () => {
    const sitemap = await post("/generate", {
      urls: [{ loc: "https://a.test/" }, { loc: "https://a.test/b" }],
      includeLastmod: false,
    });
    expect(sitemap.body).toMatchObject({ success: true, urlCount: 2 });
    expect(sitemap.body.xml).toContain("<urlset");

    const idx = await post("/generate-index", {
      sitemaps: [{ loc: "https://a.test/1.xml" }],
    });
    expect(idx.body).toMatchObject({ success: true, sitemapCount: 1 });

    const robots = await post("/generate-robots", {
      sitemaps: ["https://a.test/sitemap.xml"],
      userAgentRules: [{ userAgent: "*", allow: [], disallow: ["/x"] }],
      crawlDelay: 2,
    });
    expect(robots.body.content).toContain("Disallow: /x");
  });

  it("validates generator input", async () => {
    const noUrls = await post("/generate", { urls: [] });
    const badLoc = await post("/generate", { urls: [{ loc: "nope" }] });
    const noSitemaps = await post("/generate-index", { sitemaps: [] });
    const noRules = await post("/generate-robots", { sitemaps: [] });
    const badUrl = await post("/validate", { url: "a.test" });

    expect(
      [noUrls, badLoc, noSitemaps, noRules, badUrl].map((r) => r.status),
    ).toEqual([400, 400, 400, 400, 400]);
  });

  it("answers 500 when a generator is given malformed input that passed validation", async () => {
    const controllers = await import("../controllers.js");
    const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

    controllers.generateSitemapController({ body: {} } as never, res as never);
    controllers.generateIndexController({ body: {} } as never, res as never);
    controllers.generateRobotsController({ body: {} } as never, res as never);

    await vi.waitFor(() => expect(res.status).toHaveBeenCalledTimes(3));
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
