import { describe, expect, it } from "vitest";
import { marketByPath } from "../../../../src/lib/i18n/markets";
import {
  MARKET_COOKIE,
  localiseHref,
  localiseLinks,
  marketCookie,
  rememberedMarket,
} from "../../../../src/lib/i18n/market-links";

const market = (path: string) => {
  const found = marketByPath(path);
  if (!found) {
    throw new Error(`No market ${path}`);
  }
  return found;
};

const frCa = market("fr-ca");

describe("the remembered market", () => {
  it("writes the reader's choice to the choice cookie", () => {
    expect(MARKET_COOKIE).toBe("exy_market_choice");
    expect(marketCookie(frCa)).toMatch(/^exy_market_choice=fr-ca; Path=\/;/);
  });

  it("reads the choice back from a request's cookies", () => {
    expect(rememberedMarket("a=1; exy_market_choice=fr-ca; b=2")).toBe(frCa);
    expect(rememberedMarket("exy_market_choice=FR-CA")).toBe(frCa);
  });

  it("is null without cookies, without the cookie, or with a value that is not a market", () => {
    expect(rememberedMarket(null)).toBeNull();
    expect(rememberedMarket("")).toBeNull();
    expect(rememberedMarket("exy_market=fr-ca; other=1")).toBeNull();
    expect(rememberedMarket("exy_market_choice=xx=yy")).toBeNull();
  });
});

describe("localising one link", () => {
  it("puts a site path inside the market", () => {
    expect(localiseHref("/contact", frCa)).toBe("/fr-ca/contact");
    expect(localiseHref("/", frCa)).toBe("/fr-ca");
    expect(localiseHref("/page.html", frCa)).toBe("/fr-ca/page.html");
  });

  it("keeps the query and the fragment", () => {
    expect(localiseHref("/contact?topic=ai#form", frCa)).toBe("/fr-ca/contact?topic=ai#form");
    expect(localiseHref("/blog#latest", frCa)).toBe("/fr-ca/blog#latest");
  });

  it("treats the site's own absolute URLs as site paths", () => {
    expect(localiseHref("https://exyconn.com/about-us", frCa)).toBe("/fr-ca/about-us");
    expect(localiseHref("https://exyconn.com", frCa)).toBe("/fr-ca");
  });

  it("leaves other sites, anchors and other schemes alone", () => {
    expect(localiseHref("https://example.com/contact", frCa)).toBeNull();
    expect(localiseHref("https://exyconn.com.evil.test/x", frCa)).toBeNull();
    expect(localiseHref("//cdn.example.com/a.js", frCa)).toBeNull();
    expect(localiseHref("#top", frCa)).toBeNull();
    expect(localiseHref("mailto:hello@example.com", frCa)).toBeNull();
  });

  it("leaves assets, the API and crawler files alone", () => {
    for (const href of [
      "/_astro/app.js",
      "/assets/logo.svg",
      "/api/form-submit",
      "/health",
      "/robots.txt",
      "/sitemap.xml",
      "/llms.txt",
      "/favicon.svg",
      "/brochure.pdf",
    ]) {
      expect(localiseHref(href, frCa)).toBeNull();
    }
  });

  it("leaves a link that already names a market", () => {
    expect(localiseHref("/en-us/about-us", frCa)).toBeNull();
  });
});

describe("localising a page's links", () => {
  it("rewrites links and form targets, keeping each tag's quoting", () => {
    const html =
      '<a class="nav" href="/contact">Contact</a>' +
      "<form action='/contact-us' method=\"post\"></form>" +
      '<A HREF="/blog">Blog</A>';

    expect(localiseLinks(html, frCa)).toBe(
      '<a class="nav" href="/fr-ca/contact">Contact</a>' +
        "<form action='/fr-ca/contact-us' method=\"post\"></form>" +
        '<A HREF="/fr-ca/blog">Blog</A>'
    );
  });

  it("leaves links it must not touch, and every tag that is not a link or form", () => {
    const html =
      '<link rel="canonical" href="/contact">' +
      '<a href="https://example.com">Out</a>' +
      '<a href="/fr-fr/contact">Picker</a>' +
      '<img src="/contact">';

    expect(localiseLinks(html, frCa)).toBe(html);
  });
});
