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

const sitemap = async (headers: Record<string, string> = { host: "exyconn.com" }) => {
  const response = await GET(
    routeContext(new Request("https://exyconn.com/sitemap.xml", { headers }))
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

describe("GET /sitemap.xml on the market site", () => {
  it("lists every page in every market, the CMS's pages once beside the site's own", async () => {
    mocks.publishedPaths.mockResolvedValue({ site: null, paths: ["/about-us", "/landing"] });

    const { response, xml } = await sitemap();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/xml");
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=3600");
    expect(mocks.publishedPaths).toHaveBeenCalledWith("exyconn.com");
    expect(mocks.aiServicePaths).toHaveBeenCalledWith(undefined);
    const pages = sitePages(["/ai-services/voice-agents"]).length + 1;
    expect(urls(xml)).toBe(pages * MARKETS.length);
    expect(xml).toContain("<loc>https://exyconn.com/fr-ca/landing</loc>");
    expect(xml).toContain("<loc>https://exyconn.com/en-in/ai-services/voice-agents</loc>");
  });

  it("ranks home first, top-level pages next and deeper pages last", async () => {
    mocks.publishedPaths.mockResolvedValue({ site: null, paths: [] });
    const { xml } = await sitemap();

    expect(xml).toContain(
      "<loc>https://exyconn.com/en-us</loc>\n    <lastmod>2026-10-07</lastmod>\n" +
        "    <changefreq>daily</changefreq>\n    <priority>1.0</priority>"
    );
    expect(xml).toContain(
      "<loc>https://exyconn.com/en-us/about-us</loc>\n    <lastmod>2026-10-07</lastmod>\n" +
        "    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>"
    );
    expect(xml).toContain(
      "<loc>https://exyconn.com/en-us/services/maintenance</loc>\n    <lastmod>2026-10-07</lastmod>\n" +
        "    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>"
    );
  });

  it("lists every market, and the default as x-default, as alternates of each page", async () => {
    mocks.publishedPaths.mockResolvedValue({ site: null, paths: [] });
    const { xml } = await sitemap();

    expect(xml).toContain(
      '<xhtml:link rel="alternate" hreflang="fr-CA" href="https://exyconn.com/fr-ca/contact" />'
    );
    expect(xml).toContain(
      '<xhtml:link rel="alternate" hreflang="x-default" href="https://exyconn.com/en-us/contact" />'
    );
  });

  it("reads the AI pages of the site the host serves, and a request without a host", async () => {
    mocks.publishedPaths.mockResolvedValue({ site: site({}), paths: [] });
    await sitemap({});

    expect(mocks.publishedPaths).toHaveBeenCalledWith("");
    expect(mocks.aiServicePaths).toHaveBeenCalledWith("site-1");
  });

  it("keeps market URLs for a site without markets that has no domain of its own", async () => {
    mocks.publishedPaths.mockResolvedValue({ site: site({ markets: false }), paths: [] });
    const { xml } = await sitemap();
    expect(xml).toContain("<loc>https://exyconn.com/en-us</loc>");
  });
});

describe("GET /sitemap.xml on a CMS site without markets", () => {
  it("lists its published pages once each, on its own domain", async () => {
    mocks.publishedPaths.mockResolvedValue({
      site: site({ markets: false, domains: ["blog.example.com", "www.blog.example.com"] }),
      paths: ["", "/newsletter/october"],
    });

    const { xml } = await sitemap({ host: "blog.example.com" });

    expect(urls(xml)).toBe(2);
    expect(xml).toContain(
      "<loc>https://blog.example.com/</loc>\n    <lastmod>2026-10-07</lastmod>"
    );
    expect(xml).toContain("<loc>https://blog.example.com/newsletter/october</loc>");
    expect(xml).not.toContain("xhtml:link rel");
    expect(mocks.aiServicePaths).not.toHaveBeenCalled();
  });
});
