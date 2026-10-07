/** Which loader a CMS page runs, the item a component reads and where a request is served. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { detailOf, loadCmsPage, routeLoadInput } from "../../../../../src/lib/cms/loaders";
import { renderContext } from "../../../../../src/lib/cms/render";
import { DEFAULT_MARKET } from "../../../../../src/lib/i18n/markets";
import { BRANDING_FALLBACK } from "../../../../../src/lib/portal";
import { cmsSite, component, pageData } from "../fixtures";
import { EN_IN, SITE_URL } from "./input";

const INPUT = { site: "exyconn", market: EN_IN, siteUrl: SITE_URL };
const CRUMBS = [{ label: "Home", href: "/" }, { label: "Blog" }];

describe("loadCmsPage", () => {
  it("reads nothing for a page without a loading component", async () => {
    const page = pageData({
      blocks: [{ kind: "html", html: "<p>" }, component("home.hero"), component("toString")],
    });
    await expect(loadCmsPage(page, INPUT)).resolves.toEqual({});
  });

  it("runs the first loading component found depth first, and names it", async () => {
    const page = pageData({
      blocks: [
        { kind: "fragment", fragmentId: "header" },
        component("layout.wrap", {}, [component("blog.list", { crumbs: CRUMBS })]),
        component("casestudy.list", { crumbs: [] }),
      ],
    });
    const load = await loadCmsPage(page, INPUT);
    expect(load?.source).toBe("blog.list");
    expect(load?.jsonLd?.[0].itemListElement).toHaveLength(2);
  });

  it("is null when the template's item does not exist", async () => {
    const page = pageData({ kind: "TEMPLATE", params: {}, blocks: [component("blog.article")] });
    await expect(loadCmsPage(page, INPUT)).resolves.toBeNull();
  });
});

describe("detailOf", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const context = (detail: { key: string; item: unknown } | null) =>
    renderContext("s", BRANDING_FALLBACK, {}, {}, [], "exyconn", detail);

  it("hands the component the item its own loader read", () => {
    const item = { slug: "x" };
    expect(detailOf(context({ key: "blog.article", item }), "blog.article")).toBe(item);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("warns and gives nothing when the item belongs to another component or is missing", () => {
    expect(detailOf(context({ key: "tools.detail", item: {} }), "blog.article")).toBeNull();
    expect(detailOf(context(null), "career.job")).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(
      'CMS component "career.job" has no item to show on this page; it was skipped.'
    );
  });
});

describe("routeLoadInput", () => {
  const astroSite = new URL("https://exyconn.com/");

  it("serves a site with its own domain from that domain", () => {
    const site = cmsSite({ slug: "acme", markets: false, domains: ["acme.test", "www.acme.test"] });
    expect(routeLoadInput(site, { market: EN_IN, astroSite })).toEqual({
      site: "acme",
      market: EN_IN,
      siteUrl: "https://acme.test",
    });
  });

  it("serves a market site from astro's site without the trailing slash", () => {
    const site = cmsSite({ markets: true, domains: ["exyconn.com"] });
    expect(routeLoadInput(site, { market: undefined, astroSite })).toEqual({
      site: "exyconn",
      market: DEFAULT_MARKET,
      siteUrl: "https://exyconn.com",
    });
  });

  it("falls back to exyconn.com without astro's site or any domain", () => {
    const site = cmsSite({ markets: false, domains: [] });
    expect(routeLoadInput(site, { market: EN_IN, astroSite: undefined }).siteUrl).toBe(
      "https://exyconn.com"
    );
  });
});
