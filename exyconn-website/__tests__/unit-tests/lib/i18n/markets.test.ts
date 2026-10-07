import { describe, expect, it } from "vitest";
import {
  DEFAULT_MARKET,
  MARKETS,
  chooseMarket,
  marketByPath,
  marketUrl,
  marketsSpeaking,
  splitMarketPath,
} from "../../../../src/lib/i18n/markets";

const market = (path: string) => {
  const found = marketByPath(path);
  if (!found) {
    throw new Error(`No market ${path}`);
  }
  return found;
};

describe("market registry", () => {
  it("reads every market from the shared registry, each path unique", () => {
    expect(MARKETS.length).toBeGreaterThan(0);
    expect(new Set(MARKETS.map((entry) => entry.path)).size).toBe(MARKETS.length);
  });

  it("defaults to the largest English market", () => {
    expect(DEFAULT_MARKET.path).toBe("en-us");
    expect(DEFAULT_MARKET.locale).toBe("en-US");
  });

  it("finds a market by its URL segment, whatever its case", () => {
    expect(marketByPath("FR-CA")?.label).toBe("Canada - Français");
    expect(marketByPath("xx-yy")).toBeNull();
    expect(marketByPath("")).toBeNull();
    expect(marketByPath(undefined)).toBeNull();
  });

  it("lists one language's markets in registry order", () => {
    expect(marketsSpeaking("de").map((entry) => entry.path)).toEqual([
      "de-de",
      "de-lu",
      "de-at",
      "de-ch",
    ]);
    expect(marketsSpeaking("xx")).toEqual([]);
  });
});

describe("market URLs", () => {
  it("prefixes a page with the market, home becoming the bare market", () => {
    expect(marketUrl(market("en-in"), "/about-us")).toBe("/en-in/about-us");
    expect(marketUrl(market("en-in"), "/")).toBe("/en-in");
  });

  it("splits a path into its market and the page beneath it", () => {
    expect(splitMarketPath("/en-in/about-us/")).toEqual({
      market: market("en-in"),
      rest: "/about-us",
    });
    expect(splitMarketPath("/EN-IN/About")).toEqual({ market: market("en-in"), rest: "/About" });
    expect(splitMarketPath("/fr-ca")).toEqual({ market: market("fr-ca"), rest: "/" });
    expect(splitMarketPath("/fr-ca///")).toEqual({ market: market("fr-ca"), rest: "/" });
  });

  it("leaves a path without a market as it is", () => {
    expect(splitMarketPath("/about-us")).toEqual({ market: null, rest: "/about-us" });
    expect(splitMarketPath("/")).toEqual({ market: null, rest: "/" });
  });
});

describe("choosing a market for a visitor", () => {
  const choose = (accept: string | null, country: string | null = null) =>
    chooseMarket(accept, country).path;

  it("falls back to the default when nothing is known", () => {
    expect(choose(null)).toBe("en-us");
    expect(choose("")).toBe("en-us");
    expect(choose("xx", "ZZ")).toBe("en-us");
  });

  it("lets the country choose between one language's markets", () => {
    expect(choose("fr", "CA")).toBe("fr-ca");
    expect(choose("en-US", "in")).toBe("en-in");
    expect(choose("pt-PT", "BR")).toBe("pt-br");
  });

  it("reads the country from the browser's own tags when the edge sends none", () => {
    expect(choose("fr-BE,fr;q=0.9")).toBe("fr-be");
    expect(choose("en-GB")).toBe("en-gb");
    expect(choose("pt-PT")).toBe("pt-pt");
  });

  it("uses a tag that names a market exactly when the country has none in that language", () => {
    expect(choose("fr-ca", "US")).toBe("fr-ca");
  });

  it("prefers the default market for plain English, else the first market of the language", () => {
    expect(choose("en")).toBe("en-us");
    expect(choose("es")).toBe("es-ar");
    expect(choose("es-419")).toBe("es-ar");
  });

  it("sends an unpublished language to the country's market", () => {
    expect(choose("hi-IN")).toBe("en-in");
    expect(choose("ta-IN, en")).toBe("en-in");
    expect(choose(null, "DE")).toBe("de-de");
  });

  it("covers a country served by a regional market", () => {
    expect(choose("xx", "ae")).toBe("en-gulf");
    expect(choose("en", "QA")).toBe("en-gulf");
  });

  it("orders the browser's languages by quality", () => {
    expect(choose("en;q=0.5, de;q=0.9")).toBe("de-de");
    expect(choose("de; q=0.8, fr ;q=0.9")).toBe("fr-dz");
  });

  it("ignores empty tags and tags with an unreadable quality", () => {
    expect(choose("fr;q=abc, it")).toBe("it-it");
    expect(choose(", ,it")).toBe("it-it");
  });
});
