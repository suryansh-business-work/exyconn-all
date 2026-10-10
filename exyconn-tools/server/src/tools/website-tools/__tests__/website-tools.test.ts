import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ safeRequest: vi.fn() }));
vi.mock("../../../shared/security/safe-http", () => ({
  safeRequest: mocks.safeRequest,
}));

import { mountRouter } from "../../../__tests__/helpers/mountRouter";
import routes from "../routes";
import * as services from "../services";

const app = mountRouter(routes);

/** A site answering each URL with `{ html, status }`; unknown URLs fail to fetch. */
function serve(
  pages: Record<string, string | { html: string; status: number }>,
) {
  mocks.safeRequest.mockImplementation(async (url: string) => {
    const page = pages[url];
    if (page === undefined) {
      throw new Error(`unreachable ${url}`);
    }
    return typeof page === "string"
      ? { data: page, status: 200 }
      : { data: page.html, status: page.status };
  });
}

beforeEach(() => {
  mocks.safeRequest.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("extractUrls", () => {
  const HOME = `<html><body>
    <a href="/about">  About us </a>
    <a href="/about#team">again</a>
    <a href="https://other.test/x">Other</a>
    <a href="/files/report.PDF"></a>
    <a href="#top">top</a><a href="javascript:void(0)">js</a><a href="mailto:a@b.test">m</a><a href="tel:123">t</a>
    <a href="http://[bad">bad</a><a href="">empty</a><a>none</a>
    <a href="${"/long/" + "x".repeat(10)}">${"t".repeat(150)}</a>
  </body></html>`;

  it("lists each distinct link once, typed and flagged when it is a file", async () => {
    serve({ "https://acme.io/": HOME });

    const urls = await services.extractUrls("https://acme.io/");

    expect(urls.map((u) => [u.url, u.type, u.isResource])).toEqual([
      ["https://acme.io/about", "internal", false],
      ["https://other.test/x", "external", false],
      ["https://acme.io/files/report.PDF", "internal", true],
      ["https://acme.io/long/xxxxxxxxxx", "internal", false],
    ]);
    expect(urls[0].text).toBe("About us");
    expect(urls[2].text).toBe("[No text]");
    expect(urls[3].text).toHaveLength(100);
  });

  it("stops at the requested number of links", async () => {
    serve({ "https://acme.io/": HOME });

    const urls = await services.extractUrls("https://acme.io/", 2);

    expect(urls).toHaveLength(2);
  });

  it("explains when the site cannot be fetched", async () => {
    serve({});

    await expect(services.extractUrls("https://acme.io/")).rejects.toThrow(
      "Failed to fetch the website",
    );
  });
});

describe("scanPages", () => {
  const page = (title: string, links: string[], body = "") =>
    `<html><head><title>${title}</title><meta name="description" content=" About ${title} "></head>
     <body><script>var a = 1;</script><h1>${title}</h1> <h2>S</h2> <h3>T</h3> ${body}
     ${links.map((l) => `<a href="${l}">link</a>`).join("")}<img src="i.png"></body></html>`;

  it("crawls internal pages breadth-first down to depth two", async () => {
    serve({
      "https://acme.io/": page(
        "Home",
        ["/a", "/a", "/file.zip", "https://other.test/", "/"],
        "<p>one two three</p>",
      ),
      "https://acme.io/a": page("A", ["/b"]),
      "https://acme.io/b": page("B", ["/c"]),
      "https://acme.io/c": page("C", []),
    });

    const pages = await services.scanPages("https://acme.io/");

    expect(pages.map((p) => [p.url, p.depth, p.title])).toEqual([
      ["https://acme.io/", 0, "Home"],
      ["https://acme.io/a", 1, "A"],
      ["https://acme.io/b", 2, "B"],
    ]);
    expect(pages[0]).toMatchObject({
      description: "About Home",
      statusCode: 200,
      headings: { h1: ["Home"], h2: ["S"], h3: ["T"] },
      images: 1,
      links: 5,
    });
    expect(pages[0].wordCount).toBe(7);
  });

  it("respects the page limit and skips pages that fail", async () => {
    serve({
      "https://acme.io/": page("Home", ["/gone", "/ok", "/more"]),
      "https://acme.io/ok": page("OK", []),
      "https://acme.io/more": page("More", []),
    });

    const pages = await services.scanPages("https://acme.io/", 2);

    expect(pages.map((p) => p.title)).toEqual(["Home", "OK"]);
  });

  it("names a page without a title or description, and keeps its status", async () => {
    serve({
      "https://acme.io/": { html: "<html><body>Hi</body></html>", status: 404 },
    });

    const [only] = await services.scanPages("https://acme.io/");

    expect(only).toMatchObject({
      title: "[No Title]",
      description: "",
      statusCode: 404,
      wordCount: 1,
    });
  });
});

describe("analyzeStructure", () => {
  const page = (title: string, links: string[]) =>
    `<html><head><title>${title}</title></head><body>${links
      .map((l) => `<a href="${l}">l</a>`)
      .join("")}<a>no href</a></body></html>`;

  it("maps links between pages and finds the ones nothing links to", async () => {
    serve({
      "https://acme.io/": page("Home", [
        "/a",
        "/a",
        "/pic.png",
        "https://other.test/",
        "/b",
      ]),
      "https://acme.io/a": page("A", ["/", "/b"]),
      "https://acme.io/b": page("", []),
    });

    const result = await services.analyzeStructure("https://acme.io/");

    expect(result).toMatchObject({
      baseUrl: "https://acme.io",
      totalPages: 3,
      totalInternalLinks: 4,
      totalExternalLinks: 0,
      maxDepth: 1,
      orphanPages: [],
    });
    expect(result.linkMap).toEqual({
      "https://acme.io/": ["https://acme.io/a", "https://acme.io/b"],
      "https://acme.io/a": ["https://acme.io/", "https://acme.io/b"],
      "https://acme.io/b": [],
    });
    expect(
      result.pages.map((p) => [
        p.url,
        p.incomingLinks,
        p.outgoingLinks,
        p.title,
      ]),
    ).toEqual([
      ["https://acme.io/a", 2, 2, "A"],
      ["https://acme.io/b", 2, 0, "[No Title]"],
      ["https://acme.io/", 1, 3, "Home"],
    ]);
  });

  it("reports a deeper page nothing links to as an orphan, and stops at depth two", async () => {
    serve({
      "https://acme.io/": page("Home", ["/a"]),
      "https://acme.io/a": page("A", ["/b"]),
      "https://acme.io/b": page("B", ["/c"]),
      "https://acme.io/c": page("C", []),
    });

    const result = await services.analyzeStructure("https://acme.io/");

    expect(result.pages.map((p) => p.depth).sort()).toEqual([0, 1, 2]);
    expect(result.orphanPages).toEqual([]);
    expect(result.maxDepth).toBe(2);
  });

  it("respects the page limit", async () => {
    serve({
      "https://acme.io/": page("Home", ["/a", "/b"]),
      "https://acme.io/a": page("A", []),
      "https://acme.io/b": page("B", []),
    });

    const result = await services.analyzeStructure("https://acme.io/", 2);

    expect(result.totalPages).toBe(2);
  });

  it("returns an empty structure, with depth 0, when the first page cannot be fetched", async () => {
    serve({});

    const result = await services.analyzeStructure("https://acme.io/");

    expect(result).toMatchObject({
      totalPages: 0,
      maxDepth: 0,
      pages: [],
      orphanPages: [],
    });
  });
});

describe("empty links and status handling", () => {
  it("skips an empty href while scanning and mapping", async () => {
    serve({
      "https://acme.io/":
        '<html><body><a href="">e</a><a href="/a">a</a></body></html>',
      "https://acme.io/a": "<html></html>",
    });

    const pages = await services.scanPages("https://acme.io/");
    const structure = await services.analyzeStructure("https://acme.io/");

    expect(pages.map((p) => p.url)).toEqual([
      "https://acme.io/",
      "https://acme.io/a",
    ]);
    expect(structure.totalPages).toBe(2);
  });

  it("fetches pages accepting any status below 500", async () => {
    serve({ "https://acme.io/": "<html></html>" });
    await services.scanPages("https://acme.io/");

    const [, config] = mocks.safeRequest.mock.calls[0];
    expect(config.validateStatus(404)).toBe(true);
    expect(config.validateStatus(500)).toBe(false);
  });
});

describe("routes", () => {
  const post = (path: string, body: object) =>
    request(app).post(path).send(body);

  it("serves each analysis with its counts", async () => {
    serve({
      "https://acme.io/": `<html><body><a href="/a">A</a><a href="https://o.test/">O</a><a href="/f.pdf">F</a></body></html>`,
      "https://acme.io/a": "<html><body>A</body></html>",
    });

    const urls = await post("/extract-urls", { url: "https://acme.io/" });
    expect(urls.body).toMatchObject({
      success: true,
      totalUrls: 3,
      internalCount: 2,
      externalCount: 1,
      resourceCount: 1,
    });

    const scan = await post("/scan-pages", {
      url: "https://acme.io/",
      maxPages: 5,
    });
    expect(scan.body).toMatchObject({ success: true, totalPages: 2 });

    const structure = await post("/analyze-structure", {
      url: "https://acme.io/",
    });
    expect(structure.body).toMatchObject({
      success: true,
      totalPages: 2,
      baseUrl: "https://acme.io",
    });
  });

  it.each([
    ["/extract-urls", "Failed to fetch the website"],
    ["/scan-pages", "Failed to scan pages"],
    ["/analyze-structure", "Failed to analyze structure"],
  ])(
    "POST %s answers 500 with a message that is safe to show",
    async (path, message) => {
      vi.stubEnv("NODE_ENV", "production");
      serve({});
      mocks.safeRequest.mockImplementation(() => {
        throw new Error("down");
      });

      const res = await post(path, { url: "https://acme.io/" });
      vi.unstubAllEnvs();

      // the page fetch failure is swallowed per page, so only extract-urls reports it
      if (path === "/extract-urls") {
        expect(res.status).toBe(500);
        expect(res.body.error).toBe(message);
      } else {
        expect(res.status).toBe(200);
        expect(res.body.totalPages).toBe(0);
      }
    },
  );

  it("rejects a url without a protocol, and out-of-range limits", async () => {
    const noProtocol = await post("/extract-urls", { url: "acme.io" });
    const tooMany = await post("/scan-pages", {
      url: "https://acme.io",
      maxPages: 500,
    });

    expect([noProtocol.status, tooMany.status]).toEqual([400, 400]);
  });

  it("answers 400 or 500 from the controller itself for a body the validators let through", async () => {
    const controllers = await import("../controllers.js");
    const res = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn() });

    for (const handler of [
      controllers.extractUrlsController,
      controllers.scanPagesController,
      controllers.analyzeStructureController,
    ]) {
      const missing = res();
      await handler({ body: {} } as never, missing as never);
      expect(missing.status).toHaveBeenCalledWith(400);
      expect(missing.json).toHaveBeenCalledWith({ error: "URL is required" });

      const invalid = res();
      await handler({ body: { url: "not a url" } } as never, invalid as never);
      expect(invalid.status).toHaveBeenCalledWith(500);
    }
  });
});
