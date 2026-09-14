import { describe, expect, it } from "vitest";
import {
  localiseHref,
  localiseLinks,
  marketCookie,
  rememberedMarket,
} from "../src/lib/i18n/market-links";
import { marketByPath, type Market } from "../src/lib/i18n/markets";

const frCa = marketByPath("fr-ca") as Market;
const enIn = marketByPath("en-in") as Market;

describe("a link on a page read in one market", () => {
  it("stays in that market, where it was written without one", () => {
    expect(localiseHref("/contact", frCa)).toBe("/fr-ca/contact");
    expect(localiseHref("/services/data-analytics", frCa)).toBe("/fr-ca/services/data-analytics");
  });

  it("takes the home page to the market's own home", () => {
    expect(localiseHref("/", enIn)).toBe("/en-in");
  });

  it("keeps its query and its anchor", () => {
    expect(localiseHref("/blog?tag=ai#latest", frCa)).toBe("/fr-ca/blog?tag=ai#latest");
  });

  it("brings an absolute link to this site inside the market too", () => {
    expect(localiseHref("https://exyconn.com/blog", frCa)).toBe("/fr-ca/blog");
  });

  it("leaves a link that already names a market alone — the picker points elsewhere on purpose", () => {
    expect(localiseHref("/de-de/contact", frCa)).toBeNull();
  });

  it("leaves everything that is not a page on this site alone", () => {
    for (const href of [
      "https://github.com/exyconn",
      "//cdn.example.com/x",
      "#pricing",
      "mailto:hello@exyconn.com",
      "tel:+911234",
      "/api/form-submit",
      "/_astro/index.css",
      "/assets/logo.svg",
      "/favicon.ico",
      "/sitemap.xml",
    ]) {
      expect(localiseHref(href, frCa)).toBeNull();
    }
  });
});

describe("a whole page", () => {
  it("rewrites the links and forms a reader navigates by, and nothing else", () => {
    const html = [
      '<a class="nav" href="/contact">Contact</a>',
      "<a href='/about-us'>About</a>",
      '<form action="/search" method="get"></form>',
      '<link rel="stylesheet" href="/_astro/app.css">',
      '<link rel="alternate" hreflang="de-DE" href="/de-de/contact">',
      '<script>fetch("/api/search-index.json")</script>',
      '<a href="/de-de/contact">Deutschland - Deutsch</a>',
    ].join("");

    const out = localiseLinks(html, frCa);

    expect(out).toContain('<a class="nav" href="/fr-ca/contact">');
    expect(out).toContain("<a href='/fr-ca/about-us'>");
    expect(out).toContain('<form action="/fr-ca/search" method="get">');
    expect(out).toContain('href="/_astro/app.css"');
    expect(out).toContain('hreflang="de-DE" href="/de-de/contact"');
    expect(out).toContain('fetch("/api/search-index.json")');
    expect(out).toContain('<a href="/de-de/contact">Deutschland - Deutsch</a>');
  });
});

describe("the remembered market", () => {
  it("is read back from the cookie it was written to", () => {
    const [pair] = marketCookie(frCa).split(";");
    expect(rememberedMarket(`theme=dark; ${pair}; other=1`)).toEqual(frCa);
  });

  it("lasts a year, for the whole site, and is not sent cross-site", () => {
    expect(marketCookie(frCa)).toMatch(/Path=\//);
    expect(marketCookie(frCa)).toMatch(/Max-Age=31536000/);
    expect(marketCookie(frCa)).toMatch(/SameSite=Lax/);
  });

  it("is ignored when absent or not a market anybody publishes", () => {
    expect(rememberedMarket(null)).toBeNull();
    expect(rememberedMarket("theme=dark")).toBeNull();
    expect(rememberedMarket("exy_market=xx-yy")).toBeNull();
  });
});
