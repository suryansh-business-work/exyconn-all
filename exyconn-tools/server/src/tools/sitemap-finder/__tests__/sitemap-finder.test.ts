import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ safeRequest: vi.fn() }));
vi.mock("../../../shared/security/safe-http", () => ({
  safeRequest: mocks.safeRequest,
}));

import { mountRouter } from "../../../__tests__/helpers/mountRouter";
import { findSitemapsController } from "../controllers";
import routes from "../routes";
import { findSitemaps } from "../services";

type Reply =
  { status?: number; data: unknown; headers?: Record<string, string> } | Error;

/** A site that answers from `pages`; anything else is a 404. */
function serve(pages: Record<string, Reply>) {
  mocks.safeRequest.mockImplementation(async (url: string) => {
    const reply = pages[url];
    if (reply instanceof Error) {
      throw reply;
    }
    const answer = reply ?? { status: 404, data: "not found" };
    return { status: 200, headers: {}, ...answer };
  });
}

const urlset = (count: number) =>
  `<?xml version="1.0"?><urlset>${Array.from({ length: count }, (_, i) => `<url><loc>https://acme.io/${i}</loc></url>`).join("")}</urlset>`;

const index = (...locs: Array<string | { loc?: string; lastmod?: string }>) =>
  `<sitemapindex>${locs
    .map((entry) => {
      const item = typeof entry === "string" ? { loc: entry } : entry;
      return `<sitemap>${item.loc ? `<loc>${item.loc}</loc>` : ""}${item.lastmod ? `<lastmod>${item.lastmod}</lastmod>` : ""}</sitemap>`;
    })
    .join("")}</sitemapindex>`;

const OPTIONS = { common: false, robots: true, depth: 2 };
const find = (url: string, options: Partial<typeof OPTIONS> = {}) => {
  const { common, robots, depth } = { ...OPTIONS, ...options };
  return findSitemaps(url, common, robots, depth);
};

beforeEach(() => {
  mocks.safeRequest.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("findSitemaps via robots.txt", () => {
  it("fetches each Sitemap line, expanding an index into the sitemaps it lists", async () => {
    serve({
      "https://acme.io/robots.txt": {
        data: [
          "User-agent: *",
          "Sitemap: https://acme.io/sitemap_index.xml",
          "sitemap: https://acme.io/sitemap_index.xml",
          "SITEMAP:",
          "Sitemap: https://acme.io/pages.txt",
          "Sitemap: https://acme.io/gone.xml",
        ].join("\n"),
      },
      "https://acme.io/sitemap_index.xml": {
        data: index(
          { loc: "https://acme.io/posts.xml", lastmod: "2026-10-01" },
          "https://acme.io/posts.xml",
          { lastmod: "2026-10-02" },
          "https://acme.io/missing.xml",
        ),
        headers: { "content-length": "2048" },
      },
      "https://acme.io/posts.xml": {
        data: urlset(3),
        headers: { "content-length": "1536" },
      },
      "https://acme.io/pages.txt": {
        data: "https://acme.io/a\nnot a url\n\nhttp://acme.io/b\n",
        headers: { "content-length": "0" },
      },
    });

    const result = await find("acme.io/some/page");

    expect(result.baseUrl).toBe("https://acme.io");
    expect(result.robotsTxtExists).toBe(true);
    expect(result.robotsTxtUrl).toBe("https://acme.io/robots.txt");
    expect(result.sitemapsFound).toEqual([
      {
        url: "https://acme.io/sitemap_index.xml",
        type: "index",
        urlCount: 4,
        lastModified: undefined,
        isValid: true,
        size: "2 KB",
      },
      {
        url: "https://acme.io/posts.xml",
        type: "xml",
        urlCount: 3,
        lastModified: "2026-10-01",
        isValid: true,
        size: "1.5 KB",
      },
      {
        url: "https://acme.io/missing.xml",
        type: "xml",
        urlCount: 0,
        lastModified: undefined,
        isValid: false,
        errorMessage: "Failed to fetch sitemap",
      },
      {
        url: "https://acme.io/pages.txt",
        type: "txt",
        urlCount: 2,
        lastModified: undefined,
        isValid: true,
        size: "0 Bytes",
      },
      {
        url: "https://acme.io/gone.xml",
        type: "xml",
        urlCount: 0,
        lastModified: undefined,
        isValid: false,
        errorMessage: "Failed to fetch sitemap",
      },
    ]);
    expect(result.totalUrls).toBe(5);
    expect(result.checkedLocations).toEqual([
      "https://acme.io/robots.txt",
      "https://acme.io/sitemap_index.xml",
      "https://acme.io/pages.txt",
      "https://acme.io/gone.xml",
    ]);
    expect(result.scanTime).toBeGreaterThanOrEqual(0);
  });

  it("does not expand an index nested past the depth limit", async () => {
    serve({
      "https://acme.io/robots.txt": { data: "Sitemap: https://acme.io/a.xml" },
      "https://acme.io/a.xml": { data: index("https://acme.io/b.xml") },
      "https://acme.io/b.xml": { data: index("https://acme.io/c.xml") },
      "https://acme.io/c.xml": { data: urlset(1) },
    });

    const shallow = await find("https://acme.io", { depth: 2 });
    expect(shallow.sitemapsFound.map((entry) => entry.url)).toEqual([
      "https://acme.io/a.xml",
      "https://acme.io/b.xml",
    ]);

    const deep = await find("https://acme.io", { depth: 3 });
    expect(deep.sitemapsFound.map((entry) => entry.url)).toEqual([
      "https://acme.io/a.xml",
      "https://acme.io/b.xml",
      "https://acme.io/c.xml",
    ]);
  });

  it("reports a missing robots.txt, and one that is not served as 200", async () => {
    serve({});
    const none = await find("https://acme.io");
    expect(none).toMatchObject({
      robotsTxtExists: false,
      sitemapsFound: [],
      totalUrls: 0,
    });
    expect(none.robotsTxtUrl).toBeUndefined();

    serve({ "https://acme.io/robots.txt": { status: 301, data: "" } });
    const redirected = await find("https://acme.io");
    expect(redirected.robotsTxtExists).toBe(false);
  });

  it("survives a sitemap that is not valid XML", async () => {
    serve({
      "https://acme.io/robots.txt": {
        data: "Sitemap: https://acme.io/broken.xml",
      },
      "https://acme.io/broken.xml": { data: "<sitemapindex" },
    });

    const result = await find("https://acme.io");

    expect(result.sitemapsFound).toEqual([
      {
        url: "https://acme.io/broken.xml",
        type: "index",
        urlCount: 0,
        lastModified: undefined,
        isValid: true,
        size: undefined,
      },
    ]);
    expect(console.error).toHaveBeenCalledWith(
      "Error parsing sitemap index:",
      expect.any(Error),
    );
  });

  it("skips robots.txt entirely when asked to", async () => {
    serve({});

    const result = await find("https://acme.io", { robots: false });

    expect(result.checkedLocations).toEqual([]);
    expect(mocks.safeRequest).not.toHaveBeenCalled();
  });
});

describe("findSitemaps over the common paths", () => {
  it("probes each well-known location and keeps the real sitemaps", async () => {
    serve({
      "https://acme.io/sitemap.xml": { data: urlset(1) },
      "https://acme.io/sitemap_index.xml": {
        data: index("https://acme.io/sitemap.xml"),
      },
      "https://acme.io/sitemap.txt": { data: "https://acme.io/a" },
      "https://acme.io/sitemap.html": {
        data: "<html><a href='/a'>Sitemap A</a><a href='/b'>B</a><a>none</a></html>",
      },
      "https://acme.io/sitemap": {
        data: "<!DOCTYPE html><html>Page not found - sitemap</html>",
      },
      "https://acme.io/wp-sitemap.xml": { data: "<html>Welcome</html>" },
      "https://acme.io/news-sitemap.xml": { status: 204, data: "" },
      "https://acme.io/post-sitemap.xml": new Error("socket hang up"),
    });

    const result = await find("https://acme.io", {
      common: true,
      robots: false,
    });

    expect(result.checkedLocations).toHaveLength(19);
    expect(
      result.sitemapsFound.map((entry) => [
        entry.url,
        entry.type,
        entry.urlCount,
      ]),
    ).toEqual([
      ["https://acme.io/sitemap.xml", "xml", 1],
      ["https://acme.io/sitemap_index.xml", "index", 1],
      ["https://acme.io/sitemap.txt", "txt", 1],
      ["https://acme.io/sitemap.html", "html", 2],
    ]);
    expect(result.totalUrls).toBe(4);
  });

  it("does not fetch a location robots.txt already covered", async () => {
    serve({
      "https://acme.io/robots.txt": {
        data: "Sitemap: https://acme.io/sitemap.xml",
      },
      "https://acme.io/sitemap.xml": { data: urlset(2) },
    });

    const result = await find("https://acme.io", { common: true });

    expect(result.sitemapsFound).toHaveLength(1);
    expect(
      mocks.safeRequest.mock.calls.filter(
        ([url]) => url === "https://acme.io/sitemap.xml",
      ),
    ).toHaveLength(1);
  });

  it("reads JSON bodies as text and treats 4xx as not found", async () => {
    serve({
      "https://acme.io/sitemap.xml": { data: { not: "xml" } },
      "https://acme.io/sitemap_index.xml": { status: 403, data: "" },
    });

    const result = await find("https://acme.io", {
      common: true,
      robots: false,
    });

    expect(result.sitemapsFound).toEqual([
      {
        url: "https://acme.io/sitemap.xml",
        type: "xml",
        urlCount: 0,
        lastModified: undefined,
        isValid: true,
        size: undefined,
      },
    ]);
  });

  it("recognises a single-entry urlset and text that merely looks like a list", async () => {
    serve({
      "https://acme.io/sitemap.xml": {
        data: "<urlset><url><loc>https://acme.io/</loc></url></urlset>",
      },
      "https://acme.io/sitemap.txt": { data: "plain words" },
      "https://acme.io/sitemap.html": {
        data: "no markup at all, mentions sitemap",
      },
    });

    const result = await find("https://acme.io", {
      common: true,
      robots: false,
    });

    expect(
      result.sitemapsFound.map((entry) => [entry.type, entry.urlCount]),
    ).toEqual([
      ["xml", 1],
      ["txt", 0],
      ["xml", 0],
    ]);
  });

  it("counts a sitemap index with a single entry as one", async () => {
    serve({
      "https://acme.io/sitemap_index.xml": { data: index() + "" },
      "https://acme.io/sitemap-index.xml": {
        data: index("https://acme.io/x.xml"),
      },
      "https://acme.io/x.xml": { data: urlset(1) },
    });

    const result = await find("https://acme.io", {
      common: true,
      robots: false,
    });

    expect(
      result.sitemapsFound.map((entry) => [entry.url, entry.urlCount]),
    ).toEqual([
      ["https://acme.io/sitemap_index.xml", 0],
      ["https://acme.io/sitemap-index.xml", 1],
      ["https://acme.io/x.xml", 1],
    ]);
  });
});

describe("fetching", () => {
  it("treats an empty answer as an XML sitemap with no URLs", async () => {
    serve({ "https://acme.io/sitemap.xml": { data: "" } });

    const result = await find("https://acme.io", {
      common: true,
      robots: false,
    });

    expect(result.sitemapsFound).toEqual([
      {
        url: "https://acme.io/sitemap.xml",
        type: "xml",
        urlCount: 0,
        lastModified: undefined,
        isValid: true,
        size: undefined,
      },
    ]);
  });

  it("lets a 4xx through to be judged by the scanner but not a 5xx", async () => {
    serve({});
    await find("https://acme.io", { common: false, robots: true });

    const [, config] = mocks.safeRequest.mock.calls[0];
    expect(config.validateStatus(404)).toBe(true);
    expect(config.validateStatus(500)).toBe(false);
  });
});

describe("POST /find", () => {
  const app = mountRouter(routes);

  it("applies the defaults and returns the scan", async () => {
    serve({ "https://acme.io/sitemap.xml": { data: urlset(2) } });

    const res = await request(app)
      .post("/find")
      .send({ url: "https://acme.io" });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      baseUrl: "https://acme.io",
      totalUrls: 2,
    });
    expect(res.body.data.checkedLocations[0]).toBe(
      "https://acme.io/robots.txt",
    );
  });

  it("rejects an invalid body", async () => {
    const res = await request(app)
      .post("/find")
      .send({ url: "x", maxDepth: 9 });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      success: false,
      error: "Validation failed",
    });
  });

  it("carries on when every fetch fails, since each location is tried separately", async () => {
    mocks.safeRequest.mockImplementation(() => {
      throw new TypeError("unexpected");
    });

    const res = await request(app)
      .post("/find")
      .send({ url: "https://acme.io" });

    expect(res.status).toBe(200);
    expect(res.body.data.sitemapsFound).toEqual([]);
  });

  it("answers 500 with a fixed message when the request cannot be processed", async () => {
    const hostile = new Proxy(
      {},
      {
        get: () => {
          throw new Error("boom");
        },
      },
    );
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    await findSitemapsController({ body: hostile } as never, res as never);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Failed to find sitemaps",
    });
  });
});
