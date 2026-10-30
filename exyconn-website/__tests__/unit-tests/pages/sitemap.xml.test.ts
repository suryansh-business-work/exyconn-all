import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CmsSite } from "../../../src/lib/cms";

const mocks = vi.hoisted(() => ({ publishedPaths: vi.fn(), aiServicePaths: vi.fn() }));
vi.mock("../../../src/lib/cms/paths", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../src/lib/cms/paths")>()),
  publishedPaths: mocks.publishedPaths,
}));
vi.mock("../../../src/lib/cms/ai-services", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../src/lib/cms/ai-services")>()),
  aiServicePaths: mocks.aiServicePaths,
}));

import { GET } from "../../../src/pages/sitemap.xml";
import { MARKETS } from "../../../src/lib/i18n/markets";
import { sitePages } from "../../../src/lib/content/site-pages";
import { routeContext } from "./route-helpers";

const site = (overrides: Partial<CmsSite>) => ({
  id: "site-1",
  markets: true,
  domains: [],
  ...overrides,
});

const DEFAULT_HEADERS = { host: "exyconn.com" };

const sitemap = async (headers: Record<string, string> = DEFAULT_HEADERS, query = "") => {
  const response = await GET(
    routeContext(new Request(`https://exyconn.com/sitemap.xml${query}`, { headers }))
  );
  return { response, xml: await response.text() };
};

const urls = (xml: string) => xml.match(/<url>/g)?.length ?? 0;

beforeEach(() => {
  vi.useFakeTimers({ now: new Date("2026-10-07T15:00:00Z"), toFake: ["Date"] });
  mocks.publishedPaths.mockReset();
  mocks.aiServicePaths.mockReset();
  mocks.aiServicePaths.mockResolvedValue(["/ai-services/voice-agents"]);
});

afterEach(() => {
  vi.useRealTimers();
});

const marketSitemap = (market: string) => sitemap(DEFAULT_HEADERS, `?market=${market}`);

describe("GET /sitemap.xml on the market site", () => {
  it("is an index of one sitemap per market", async () => {
    mocks.publishedPaths.mockResolvedValue({ site: null, paths: [], lastmod: {} });

    const { response, xml } = await sitemap();

    expect(response.status).toBe(200);
    expect(xml).toContain("<sitemapindex");
    expect(xml.match(/<sitemap>/g)?.length).toBe(MARKETS.length);
    expect(xml).toContain(
      "<loc>https://exyconn.com/sitemap.xml?market=fr-ca</loc>\n    <lastmod>2026-10-07</lastmod>"
    );
    expect(urls(xml)).toBe(0);
    expect(mocks.aiServicePaths).not.toHaveBeenCalled();
  });

  it("answers 404 for a market that does not exist", async () => {
    mocks.publishedPaths.mockResolvedValue({ site: null, paths: [], lastmod: {} });

    const { response, xml } = await marketSitemap("xx-xx");

    expect(response.status).toBe(404);
    expect(urls(xml)).toBe(0);
  });

  it("lists every page of one market, the CMS's pages once beside the site's own", async () => {
    mocks.publishedPaths.mockResolvedValue({
      site: null,
      paths: ["/about-us", "/landing"],
      lastmod: {},
    });

    const { response, xml } = await marketSitemap("fr-ca");

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/xml");
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=3600");
    expect(mocks.publishedPaths).toHaveBeenCalledWith("exyconn.com");
    expect(mocks.aiServicePaths).toHaveBeenCalledWith(undefined);
    const pages = sitePages(["/ai-services/voice-agents"]).length + 1;
    expect(urls(xml)).toBe(pages);
    expect(xml).toContain("<loc>https://exyconn.com/fr-ca/landing</loc>");
    expect(xml).toContain("<loc>https://exyconn.com/fr-ca/ai-services/voice-agents</loc>");
    expect(xml).not.toContain("<loc>https://exyconn.com/en-in/");
  });

  it("ranks home first, top-level pages next and deeper pages last", async () => {
    mocks.publishedPaths.mockResolvedValue({ site: null, paths: [], lastmod: {} });
    const { xml } = await marketSitemap("en-us");

    expect(xml).toContain(
      "<loc>https://exyconn.com/en-us</loc>\n    <changefreq>daily</changefreq>\n" +
        "    <priority>1.0</priority>"
    );
    expect(xml).toContain(
      "<loc>https://exyconn.com/en-us/about-us</loc>\n    <changefreq>weekly</changefreq>\n" +
        "    <priority>0.8</priority>"
    );
    expect(xml).toContain(
      "<loc>https://exyconn.com/en-us/services/maintenance</loc>\n" +
        "    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>"
    );
  });

  it("dates a page by when it last changed, and leaves an undated page undated", async () => {
    mocks.publishedPaths.mockResolvedValue({
      site: null,
      paths: ["/blog/rag"],
      lastmod: { "/about-us": "2026-09-12", "/blog/rag": "2026-10-14" },
    });
    const { xml } = await marketSitemap("en-us");

    expect(xml).toContain(
      "<loc>https://exyconn.com/en-us/about-us</loc>\n    <lastmod>2026-09-12</lastmod>"
    );
    expect(xml).toContain(
      "<loc>https://exyconn.com/en-us/blog/rag</loc>\n    <lastmod>2026-10-14</lastmod>"
    );
    expect(xml).toContain("<loc>https://exyconn.com/en-us/contact</loc>\n    <changefreq>");
  });

  it("lists every market, and the default as x-default, as alternates of each page", async () => {
    mocks.publishedPaths.mockResolvedValue({ site: null, paths: [], lastmod: {} });
    const { xml } = await marketSitemap("en-us");

    expect(xml).toContain(
      '<xhtml:link rel="alternate" hreflang="fr-CA" href="https://exyconn.com/fr-ca/contact" />'
    );
    expect(xml).toContain(
      '<xhtml:link rel="alternate" hreflang="x-default" href="https://exyconn.com/en-us/contact" />'
    );
  });

  it("reads the AI pages of the site the host serves, and a request without a host", async () => {
    mocks.publishedPaths.mockResolvedValue({ site: site({}), paths: [], lastmod: {} });
    await sitemap({}, "?market=en-us");

    expect(mocks.publishedPaths).toHaveBeenCalledWith("");
    expect(mocks.aiServicePaths).toHaveBeenCalledWith("site-1");
  });

  it("keeps market URLs for a site without markets that has no domain of its own", async () => {
    mocks.publishedPaths.mockResolvedValue({
      site: site({ markets: false }),
      paths: [],
      lastmod: {},
    });
    const { xml } = await marketSitemap("en-us");
    expect(xml).toContain("<loc>https://exyconn.com/en-us</loc>");
  });
});

describe("GET /sitemap.xml on a CMS site without markets", () => {
  it("lists its published pages once each, on its own domain", async () => {
    mocks.publishedPaths.mockResolvedValue({
      site: site({ markets: false, domains: ["blog.example.com", "www.blog.example.com"] }),
      paths: ["", "/newsletter/october"],
      lastmod: { "": "2026-09-30" },
    });

    const { xml } = await sitemap({ host: "blog.example.com" });

    expect(urls(xml)).toBe(2);
    expect(xml).toContain(
      "<loc>https://blog.example.com/</loc>\n    <lastmod>2026-09-30</lastmod>"
    );
    expect(xml).toContain("<loc>https://blog.example.com/newsletter/october</loc>\n  </url>");
    expect(xml).not.toContain("xhtml:link rel");
    expect(mocks.aiServicePaths).not.toHaveBeenCalled();
  });
});
