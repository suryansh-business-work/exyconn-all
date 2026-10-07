/** The site middleware's CMS host routing, market redirect and per-market translation. */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { contextFor, HTML, nextReturning, run } from "./middleware.helpers";

const mocks = vi.hoisted(() => ({
  getCmsSite: vi.fn(),
  marketRedirect: vi.fn(),
  localiseLinks: vi.fn((html: string, market: { path: string }) => `${html}<!--${market.path}-->`),
  loadMessages: vi.fn(),
  translateMissing: vi.fn(),
  cachedPage: vi.fn(),
  cachePage: vi.fn(),
  collectStrings: vi.fn(),
  translateHtml: vi.fn(),
}));

vi.mock("../../src/lib/cms", () => ({ getCmsSite: mocks.getCmsSite }));
vi.mock("../../src/lib/i18n/market-links", () => ({
  marketRedirect: mocks.marketRedirect,
  localiseLinks: mocks.localiseLinks,
}));
vi.mock("../../src/lib/i18n/translations", () => ({
  loadMessages: mocks.loadMessages,
  translateMissing: mocks.translateMissing,
}));
vi.mock("../../src/lib/i18n/page-cache", () => ({
  cachedPage: mocks.cachedPage,
  cachePage: mocks.cachePage,
}));
vi.mock("../../src/lib/i18n/html-translate", () => ({
  collectStrings: mocks.collectStrings,
  translateHtml: mocks.translateHtml,
}));

import { onRequest } from "../../src/middleware";

const offMarketSite = { site: { markets: false }, designSystem: null, fragments: [] };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCmsSite.mockResolvedValue({ site: { markets: true } });
  mocks.cachedPage.mockReturnValue(undefined);
  mocks.marketRedirect.mockImplementation(() => new Response(null, { status: 302 }));
});

describe("hosts claimed by a CMS site without markets", () => {
  it("renders the home page through the off-market route with the site on locals", async () => {
    mocks.getCmsSite.mockResolvedValue(offMarketSite);
    const { context, locals } = contextFor("/", { host: "Client.Example" });
    const { fn, next } = nextReturning("<p>home</p>", HTML);
    const res = await run(onRequest, context, next);
    expect(mocks.getCmsSite).toHaveBeenCalledWith("client.example");
    expect(fn).toHaveBeenCalledWith("/cms-site");
    expect(locals.cmsSite).toBe(offMarketSite);
    expect(res.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
    expect(mocks.marketRedirect).not.toHaveBeenCalled();
  });

  it("keeps the page path under the off-market route", async () => {
    mocks.getCmsSite.mockResolvedValue(offMarketSite);
    const { fn, next } = nextReturning("<p>about</p>", HTML);
    await run(onRequest, contextFor("/about", { host: "client.example" }).context, next);
    expect(fn).toHaveBeenCalledWith("/cms-site/about");
  });

  it("routes by market when the claiming site uses markets", async () => {
    const res = await run(
      onRequest,
      contextFor("/about").context,
      nextReturning("<p>x</p>", HTML).next
    );
    expect(mocks.getCmsSite).toHaveBeenCalledWith("exyconn.com");
    expect(res).toBe(mocks.marketRedirect.mock.results[0]?.value);
  });

  it("logs a failed lookup and keeps the market routing", async () => {
    const error = new Error("CMS down");
    mocks.getCmsSite.mockRejectedValue(error);
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const res = await run(onRequest, contextFor("/about").context, nextReturning("x").next);
    expect(log).toHaveBeenCalledWith("CMS site lookup failed for host exyconn.com", error);
    expect(res.status).toBe(302);
    log.mockRestore();
  });

  it("skips the lookup when there is no host", async () => {
    const { context } = contextFor("/en-in/about", { isPrerendered: true });
    await run(onRequest, context, nextReturning("<p>x</p>", HTML).next);
    expect(mocks.getCmsSite).not.toHaveBeenCalled();
  });
});

describe("pages without a market", () => {
  it("treats a request without a Host header as the site itself", async () => {
    const { context } = contextFor("/about", { host: null });
    const res = await run(onRequest, context, nextReturning("x").next);
    expect(mocks.getCmsSite).not.toHaveBeenCalled();
    expect(res.status).toBe(302);
  });

  it("are redirected to the reader's market with the path and query", async () => {
    const redirect = new Response(null, { status: 302 });
    mocks.marketRedirect.mockReturnValue(redirect);
    const { context } = contextFor("/about-us.html?x=1");
    const { fn, next } = nextReturning("x");
    const res = await run(onRequest, context, next);
    expect(res).toBe(redirect);
    expect(mocks.marketRedirect).toHaveBeenCalledWith(context.request, "/about-us.html", "?x=1");
    expect(fn).not.toHaveBeenCalled();
  });
});

describe("pages in an English market", () => {
  it("are served as rendered, with links localised and the length dropped", async () => {
    const { context, locals } = contextFor("/en-in/about");
    const { next } = nextReturning("<p>About</p>", { ...HTML, "content-length": "12" });
    const res = await run(onRequest, context, next);
    expect(locals.market).toMatchObject({ path: "en-in", language: "en" });
    expect(await res.text()).toBe("<p>About</p><!--en-in-->");
    expect(res.headers.get("content-length")).toBeNull();
    expect(res.headers.get("Strict-Transport-Security")).toContain("max-age=63072000");
    expect(res.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
    expect(mocks.loadMessages).not.toHaveBeenCalled();
  });

  it("leave a response that is not HTML untouched", async () => {
    const { next } = nextReturning('{"a":1}', { "content-type": "application/json" });
    const res = await run(onRequest, contextFor("/en-in/data").context, next);
    expect(await res.text()).toBe('{"a":1}');
    expect(mocks.localiseLinks).not.toHaveBeenCalled();
  });

  it("treat a response without a content type as not HTML", async () => {
    const res = await run(onRequest, contextFor("/en-in").context, nextReturning(null).next);
    expect(res.status).toBe(200);
    expect(mocks.localiseLinks).not.toHaveBeenCalled();
  });
});

describe("pages in a market of another language", () => {
  const catalogue = { Hello: "Bonjour" };

  beforeEach(() => {
    mocks.loadMessages.mockResolvedValue(catalogue);
  });

  it("serve the cached translation when there is one", async () => {
    mocks.cachedPage.mockReturnValue("<p>Bonjour</p>");
    const { next } = nextReturning("<p>Hello</p>", HTML);
    const res = await run(onRequest, contextFor("/fr-fr/about").context, next);
    expect(mocks.loadMessages).toHaveBeenCalledWith("fr");
    expect(mocks.cachedPage).toHaveBeenCalledWith("fr-fr", "/about", catalogue);
    expect(await res.text()).toBe("<p>Bonjour</p><!--fr-fr-->");
    expect(mocks.translateHtml).not.toHaveBeenCalled();
  });

  it("translate what the catalogue lacks for the first reader, then cache it", async () => {
    const fuller = { Hello: "Bonjour", World: "Monde" };
    mocks.collectStrings.mockReturnValue(["Hello", "World"]);
    mocks.translateMissing.mockResolvedValue(fuller);
    mocks.translateHtml.mockReturnValue("<p>Bonjour Monde</p>");
    const { next } = nextReturning("<p>Hello World</p>", HTML);
    const res = await run(onRequest, contextFor("/fr-fr/about").context, next);
    expect(mocks.collectStrings).toHaveBeenCalledWith("<p>Hello World</p>");
    expect(mocks.translateMissing).toHaveBeenCalledWith("fr", ["World"], 6000);
    const lookup = mocks.translateHtml.mock.calls[0]?.[1] as (source: string) => string;
    expect(lookup("World")).toBe("Monde");
    expect(mocks.cachePage).toHaveBeenCalledWith("fr-fr", "/about", "<p>Bonjour Monde</p>", fuller);
    expect(await res.text()).toBe("<p>Bonjour Monde</p><!--fr-fr-->");
  });

  it("do not call the model when every string is already translated", async () => {
    mocks.collectStrings.mockReturnValue(["Hello"]);
    mocks.translateHtml.mockReturnValue("<p>Bonjour</p>");
    await run(onRequest, contextFor("/fr-fr").context, nextReturning("<p>Hello</p>", HTML).next);
    expect(mocks.translateMissing).not.toHaveBeenCalled();
    const lookup = mocks.translateHtml.mock.calls[0]?.[1] as (source: string) => string;
    expect(lookup("Hello")).toBe("Bonjour");
    expect(mocks.cachePage).toHaveBeenCalledWith("fr-fr", "/", "<p>Bonjour</p>", catalogue);
  });
});
