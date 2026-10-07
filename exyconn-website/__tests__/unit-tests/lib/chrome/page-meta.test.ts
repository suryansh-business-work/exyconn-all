/** buildPageMeta: every head tag of a page, from its SEO, the branding and where it is served. */
import { describe, expect, it } from "vitest";
import { ROBOTS_INDEX, ROBOTS_NOINDEX } from "@exyconn/seo";
import { buildPageMeta, faviconOf, type PagePlace } from "../../../../src/lib/chrome/page-meta";
import { MARKETS, marketByPath } from "../../../../src/lib/i18n/markets";
import { BRANDING_FALLBACK, type Branding } from "../../../../src/lib/portal";

const SITE = "https://site.test";
const enIn = marketByPath("en-in");
if (!enIn) {
  throw new Error("en-in market missing from the registry");
}

/** Branding before an admin has filled anything in: every field empty. */
const blankBranding = (): Branding => {
  const blank: Record<string, string> = {};
  Object.keys(BRANDING_FALLBACK).forEach((key) => {
    blank[key] = "";
  });
  return { ...BRANDING_FALLBACK, ...blank };
};

const inMarket = (pagePath: string): PagePlace => ({
  siteUrl: SITE,
  pagePath,
  market: enIn,
  locale: "en",
});
const offMarket = (pagePath: string): PagePlace => ({
  siteUrl: SITE,
  pagePath,
  market: null,
  locale: "fr-FR",
});

describe("faviconOf", () => {
  it("prefers the site's favicon, then branding's, then the bundled one", () => {
    const branding = { ...BRANDING_FALLBACK, faviconUrl: "/brand.svg" };
    expect(faviconOf(branding, "/site.svg")).toBe("/site.svg");
    expect(faviconOf(branding)).toBe("/brand.svg");
    expect(faviconOf(blankBranding())).toBe(BRANDING_FALLBACK.faviconUrl);
  });
});

describe("buildPageMeta defaults", () => {
  const meta = buildPageMeta({}, BRANDING_FALLBACK, inMarket(""));

  it("titles the page with the business name and slogan and the default copy", () => {
    expect(meta.title).toBe(`${BRANDING_FALLBACK.businessName} | ${BRANDING_FALLBACK.slogan}`);
    expect(meta.description).toMatch(/^Transform your business/);
    expect(meta.keywords).toBe("AI, automation, SaaS, business solutions, cloud infrastructure");
    expect(meta.robots).toBe(ROBOTS_INDEX);
    expect(meta.type).toBe("website");
    expect(meta.siteName).toBe(BRANDING_FALLBACK.businessName);
    expect(meta.themeColor).toBe(BRANDING_FALLBACK.primaryColor);
  });

  it("canonicalises the home page under the market and speaks its locale", () => {
    expect(meta.canonical).toBe(`${SITE}/en-in`);
    expect(meta.locale).toBe("en-IN");
  });

  it("lists the page in every market plus x-default", () => {
    expect(meta.alternates).toHaveLength(MARKETS.length + 1);
    expect(meta.alternates).toContainEqual({ hreflang: "en-IN", href: `${SITE}/en-in` });
    expect(meta.alternates?.at(-1)).toEqual({ hreflang: "x-default", href: `${SITE}/en-us` });
  });

  it("makes the branding OG image absolute at 1200x630", () => {
    expect(meta.image).toEqual({
      url: `${SITE}${BRANDING_FALLBACK.ogImageUrl}`,
      width: 1200,
      height: 630,
    });
  });

  it("carries the organisation and website JSON-LD only", () => {
    expect(meta.jsonLd?.map((node) => node["@type"])).toEqual(["Organization", "WebSite"]);
    expect(meta.jsonLd?.[0]).toMatchObject({
      url: BRANDING_FALLBACK.websiteUrl,
      logo: `${SITE}${BRANDING_FALLBACK.faviconUrl}`,
    });
  });
});

describe("buildPageMeta with the page's own SEO", () => {
  it("uses the page's title, copy, canonical, image, robots, type and JSON-LD", () => {
    const meta = buildPageMeta(
      {
        title: "Pricing",
        description: "What it costs",
        keywords: "price",
        metaImage: "HTTPS://cdn.test/og.png",
        canonical: "https://elsewhere.test/pricing",
        noindex: true,
        ogType: "article",
        jsonLd: { "@type": "Thing" },
      },
      BRANDING_FALLBACK,
      inMarket("/pricing")
    );
    expect(meta).toMatchObject({
      title: "Pricing",
      description: "What it costs",
      keywords: "price",
      canonical: "https://elsewhere.test/pricing",
      robots: ROBOTS_NOINDEX,
      type: "article",
      image: { url: "HTTPS://cdn.test/og.png" },
    });
    expect(meta.jsonLd?.at(-1)).toEqual({ "@type": "Thing" });
  });

  it("falls back to the meta fields and appends a list of JSON-LD nodes", () => {
    const meta = buildPageMeta(
      {
        metaTitle: "Meta title",
        metaDescription: "Meta description",
        metaKeywords: "meta",
        jsonLd: [{ "@type": "A" }, { "@type": "B" }],
      },
      BRANDING_FALLBACK,
      inMarket("/about")
    );
    expect(meta.title).toBe("Meta title");
    expect(meta.description).toBe("Meta description");
    expect(meta.keywords).toBe("meta");
    expect(meta.canonical).toBe(`${SITE}/en-in/about`);
    expect(meta.jsonLd?.slice(2)).toEqual([{ "@type": "A" }, { "@type": "B" }]);
  });
});

describe("buildPageMeta off-market and with blank branding", () => {
  it("serves an unprefixed page in the place's locale without alternates", () => {
    const meta = buildPageMeta({}, BRANDING_FALLBACK, offMarket("/about"));
    expect(meta.canonical).toBe(`${SITE}/about`);
    expect(meta.locale).toBe("fr-FR");
    expect(meta.alternates).toEqual([]);
    expect(buildPageMeta({}, BRANDING_FALLBACK, offMarket("")).canonical).toBe(`${SITE}/`);
  });

  it("falls back field by field to the bundled branding", () => {
    const meta = buildPageMeta({}, blankBranding(), offMarket(""), "https://cdn.test/fav.svg");
    expect(meta.siteName).toBe(BRANDING_FALLBACK.businessName);
    expect(meta.title).toContain(BRANDING_FALLBACK.slogan);
    expect(meta.themeColor).toBe(BRANDING_FALLBACK.primaryColor);
    expect(meta.image?.url).toBe(`${SITE}${BRANDING_FALLBACK.ogImageUrl}`);
    expect(meta.jsonLd?.[0]).toMatchObject({ url: SITE, logo: "https://cdn.test/fav.svg" });
  });

  it("uses an admin's branding values when set", () => {
    const branding = {
      ...BRANDING_FALLBACK,
      businessName: "Acme",
      slogan: "Rockets",
      ogImageUrl: "/acme-og.png",
      primaryColor: "#123456",
    };
    const meta = buildPageMeta({}, branding, offMarket(""));
    expect(meta.title).toBe("Acme | Rockets");
    expect(meta.image?.url).toBe(`${SITE}/acme-og.png`);
    expect(meta.themeColor).toBe("#123456");
  });
});
