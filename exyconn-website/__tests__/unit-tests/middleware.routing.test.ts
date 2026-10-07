/** The site middleware's redirects, embed/preview framing rules and baseline headers. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { contextFor, HTML, nextReturning, run } from "./middleware.helpers";

const mocks = vi.hoisted(() => ({
  getCmsSite: vi.fn(),
  marketRedirect: vi.fn(),
  localiseLinks: vi.fn((html: string) => html),
}));

vi.mock("../../src/lib/cms", () => ({ getCmsSite: mocks.getCmsSite }));
vi.mock("../../src/lib/i18n/market-links", () => ({
  marketRedirect: mocks.marketRedirect,
  localiseLinks: mocks.localiseLinks,
}));
vi.mock("../../src/lib/i18n/translations", () => ({
  loadMessages: vi.fn(),
  translateMissing: vi.fn(),
}));
vi.mock("../../src/lib/i18n/page-cache", () => ({ cachedPage: vi.fn(), cachePage: vi.fn() }));

import { onRequest } from "../../src/middleware";

const PERMISSIONS = "camera=(), microphone=(self), geolocation=(), interest-cohort=()";
const HSTS = "max-age=63072000; includeSubDomains; preload";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCmsSite.mockResolvedValue({ site: { markets: true } });
  mocks.marketRedirect.mockImplementation(() => new Response(null, { status: 302 }));
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("www to apex", () => {
  it("sends www.exyconn.com, in any case, to the apex keeping path and query", async () => {
    const { context } = contextFor("/en-in/about?ref=ad", { host: "WWW.Exyconn.com" });
    const { fn, next } = nextReturning("x");
    const res = await run(onRequest, context, next);
    expect(res.status).toBe(301);
    expect(res.headers.get("Location")).toBe("https://exyconn.com/en-in/about?ref=ad");
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=3600");
    expect(fn).not.toHaveBeenCalled();
  });

  it("does not read the host of a prerendered page", async () => {
    const { context, hostReads } = contextFor("/assets/app.css", {
      host: "www.exyconn.com",
      isPrerendered: true,
    });
    const res = await run(onRequest, context, nextReturning("x").next);
    expect(res.status).toBe(200);
    expect(hostReads()).toBe(0);
  });
});

describe("trailing slash", () => {
  it("drops every trailing slash and keeps the query", async () => {
    const { context } = contextFor("/en-in/about//?a=1");
    const res = await run(onRequest, context, nextReturning("x").next);
    expect(res.status).toBe(301);
    expect(res.headers.get("Location")).toBe("/en-in/about?a=1");
  });

  it("leaves a file path that ends in a slash alone", async () => {
    const { context } = contextFor("/assets/app.js/");
    const { fn, next } = nextReturning("x");
    const res = await run(onRequest, context, next);
    expect(res.status).toBe(200);
    expect(fn).toHaveBeenCalledOnce();
  });
});

describe("embed pages", () => {
  it("are framable by the default origins, never indexed and skip the markets", async () => {
    const { context } = contextFor("/embed/chat");
    const { fn, next } = nextReturning("<p>chat</p>", { ...HTML, "X-Frame-Options": "DENY" });
    const res = await run(onRequest, context, next);
    expect(fn).toHaveBeenCalledWith();
    expect(res.headers.get("X-Frame-Options")).toBeNull();
    expect(res.headers.get("Content-Security-Policy")).toBe(
      "frame-ancestors 'self' https://tools.exyconn.com"
    );
    expect(res.headers.get("X-Robots-Tag")).toBe("noindex");
    expect(res.headers.get("Permissions-Policy")).toBe(PERMISSIONS);
    expect(res.headers.get("Strict-Transport-Security")).toBe(HSTS);
    expect(mocks.marketRedirect).not.toHaveBeenCalled();
    expect(mocks.getCmsSite).not.toHaveBeenCalled();
  });

  it("take the allowed origins from CHAT_FRAME_ANCESTORS, space or comma separated", async () => {
    vi.stubEnv("CHAT_FRAME_ANCESTORS", " https://a.example, https://b.example  https://c.example ");
    const res = await run(onRequest, contextFor("/embed/chat").context, nextReturning("x").next);
    expect(res.headers.get("Content-Security-Policy")).toBe(
      "frame-ancestors 'self' https://a.example https://b.example https://c.example"
    );
  });
});

describe("CMS draft preview", () => {
  it("is served as rendered, unindexed, framable by the portal", async () => {
    const { context } = contextFor("/cms-preview?page=1");
    const { fn, next } = nextReturning("<p>draft</p>", HTML);
    const res = await run(onRequest, context, next);
    expect(fn).toHaveBeenCalledWith();
    expect(res.headers.get("X-Robots-Tag")).toBe("noindex");
    expect(res.headers.get("X-Frame-Options")).toBeNull();
    expect(res.headers.get("Content-Security-Policy")).toBe(
      "frame-ancestors 'self' https://website.exyconn.com"
    );
    expect(res.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(mocks.getCmsSite).not.toHaveBeenCalled();
  });

  it("takes the portal origins from CMS_PREVIEW_ANCESTORS", async () => {
    vi.stubEnv("CMS_PREVIEW_ANCESTORS", "http://localhost:4000,http://localhost:4001");
    const res = await run(onRequest, contextFor("/cms-preview").context, nextReturning("x").next);
    expect(res.headers.get("Content-Security-Policy")).toBe(
      "frame-ancestors 'self' http://localhost:4000 http://localhost:4001"
    );
  });
});

describe("requests that are not pages", () => {
  it.each(["/api/form-submit", "/robots.txt", "/_astro/app.js", "/images/logo.png", "/health"])(
    "passes %s straight through with the baseline headers",
    async (path) => {
      const { fn, next } = nextReturning("{}", { "content-type": "application/json" });
      const res = await run(onRequest, contextFor(path).context, next);
      expect(fn).toHaveBeenCalledWith();
      expect(res.headers.get("Strict-Transport-Security")).toBe(HSTS);
      expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(res.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
      expect(res.headers.get("Permissions-Policy")).toBe(PERMISSIONS);
      expect(res.headers.get("X-DNS-Prefetch-Control")).toBeNull();
      expect(mocks.getCmsSite).not.toHaveBeenCalled();
      expect(mocks.marketRedirect).not.toHaveBeenCalled();
    }
  );

  it("adds DNS prefetch to an HTML response that is not a page", async () => {
    const { next } = nextReturning("<p>ok</p>", HTML);
    const res = await run(onRequest, contextFor("/api/preview").context, next);
    expect(res.headers.get("X-DNS-Prefetch-Control")).toBe("on");
  });

  it("treats a response without a content type as not HTML", async () => {
    const res = await run(onRequest, contextFor("/api/ping").context, nextReturning(null).next);
    expect(res.headers.get("X-DNS-Prefetch-Control")).toBeNull();
  });

  it("does not send the prerendered error pages to a market", async () => {
    const { context } = contextFor("/404", { isPrerendered: true });
    const { fn, next } = nextReturning("<p>missing</p>", HTML);
    const res = await run(onRequest, context, next);
    expect(fn).toHaveBeenCalledWith();
    expect(mocks.marketRedirect).not.toHaveBeenCalled();
    expect(res.headers.get("X-DNS-Prefetch-Control")).toBe("on");
  });
});
