import { describe, expect, it } from "vitest";
import {
  browserMarket,
  hasChosenMarket,
  isCrawler,
  marketForRequest,
  marketRedirect,
} from "../../../../src/lib/i18n/market-links";

const CHROME = "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/130 Safari/537.36";

const request = (headers: Record<string, string> = {}) =>
  new Request("https://exyconn.com/about-us", { headers: { "user-agent": CHROME, ...headers } });

describe("crawlers", () => {
  it("recognises search engines, unfurlers and AI agents", () => {
    for (const agent of [
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "facebookexternalhit/1.1",
      "ChatGPT-User/1.0",
      "Mozilla/5.0 (compatible; bingbot/2.0)",
      "meta-externalagent/1.1",
    ]) {
      expect(isCrawler(request({ "user-agent": agent }))).toBe(true);
    }
  });

  it("does not take a browser, or a request without an agent, for one", () => {
    expect(isCrawler(request())).toBe(false);
    expect(isCrawler(new Request("https://exyconn.com/"))).toBe(false);
  });
});

describe("the browser's market", () => {
  it("reads the languages and the country the edge reports", () => {
    expect(browserMarket(request({ "accept-language": "fr", "cf-ipcountry": "CA" })).path).toBe(
      "fr-ca"
    );
    expect(browserMarket(request({ "accept-language": "fr", "x-country": "BE" })).path).toBe(
      "fr-be"
    );
  });

  it("trusts Cloudflare's country over a load balancer's", () => {
    const both = request({ "accept-language": "fr", "cf-ipcountry": "CH", "x-country": "BE" });
    expect(browserMarket(both).path).toBe("fr-ch");
  });

  it("falls back to the default market", () => {
    expect(browserMarket(request()).path).toBe("en-us");
  });
});

describe("whether the reader has chosen", () => {
  it("is true only once the choice cookie names a market", () => {
    expect(hasChosenMarket(request({ cookie: "exy_market_choice=de-at" }))).toBe(true);
    expect(hasChosenMarket(request({ cookie: "exy_market_choice=nowhere" }))).toBe(false);
    expect(hasChosenMarket(request())).toBe(false);
  });
});

describe("the market for a request without one", () => {
  const path = (headers: Record<string, string>) => marketForRequest(request(headers)).path;

  it("always gives a crawler the default market", () => {
    expect(
      path({
        "user-agent": "Googlebot/2.1",
        cookie: "exy_market_choice=fr-ca",
        "accept-language": "de",
      })
    ).toBe("en-us");
  });

  it("prefers the reader's choice over everything else", () => {
    expect(
      path({
        cookie: "exy_market_choice=fr-ca",
        referer: "https://exyconn.com/de-at/contact",
        "accept-language": "it",
      })
    ).toBe("fr-ca");
  });

  it("then keeps the reader in the market of the page they came from on this site", () => {
    expect(path({ referer: "https://exyconn.com/de-at/contact", "accept-language": "it" })).toBe(
      "de-at"
    );
  });

  it("ignores a referrer from another site, without a market, or that is not a URL", () => {
    for (const referer of [
      "https://example.com/de-at/contact",
      "https://exyconn.com/contact",
      "not a url",
    ]) {
      expect(path({ referer, "accept-language": "it" })).toBe("it-it");
    }
  });
});

describe("the market redirect", () => {
  it("sends the reader to the same page in their market, privately and temporarily", () => {
    const response = marketRedirect(
      request({ cookie: "exy_market_choice=de-de" }),
      "/about-us",
      "?ref=nav"
    );
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/de-de/about-us?ref=nav");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("Vary")).toBe("Accept-Language, Cookie, Referer, User-Agent");
  });

  it("sends home to the bare market", () => {
    const response = marketRedirect(request({ "accept-language": "it-IT" }), "/", "");
    expect(response.headers.get("Location")).toBe("/it-it");
  });
});
