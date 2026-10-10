import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ safeRequest: vi.fn(), axiosGet: vi.fn() }));
vi.mock("../../../shared/security/safe-http", () => ({
  safeRequest: mocks.safeRequest,
}));
vi.mock("axios", () => ({ default: { get: mocks.axiosGet } }));

import { mountRouter } from "../../../__tests__/helpers/mountRouter";
import routes from "../routes";
import * as services from "../services";

const app = mountRouter(routes);

const page = (body: string, head = "", html = '<html lang="en">') => ({
  data: `${html}<head>${head}</head><body>${body}</body></html>`,
  headers: {} as Record<string, string>,
});

beforeEach(() => {
  mocks.safeRequest.mockReset();
  mocks.axiosGet.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

const GOOD_HEAD = `<title>A reasonably long page title for search results</title>
  <meta name="description" content="${"d".repeat(100)}">
  <meta name="keywords" content="a,b"><meta name="robots" content="index">
  <link rel="canonical" href="https://example.org/"><meta name="viewport" content="width=device-width">
  <meta property="og:title" content="OG"><meta property="og:description" content="OGD"><meta property="og:image" content="i.png">
  <meta name="twitter:card" content="summary"><meta charset="utf-8"><link rel="icon" href="/f.ico">
  <script type="application/ld+json">{"@type":"Organization"}</script>
  <script type="application/ld+json">{"name":"no type"}</script>
  <script type="application/ld+json">{broken</script>`;

describe("seoCheck", () => {
  it("scores a well-formed page 100 and reports its metadata", async () => {
    mocks.safeRequest.mockResolvedValue(
      page(
        `<h1>Heading</h1><h2>Sub</h2><img src="a.png" alt="A"><a href="/x">in</a>
        <a href="https://other.test" rel="nofollow">out</a><a href="https://example.org/y">in2</a>
        <p>some words here</p>`,
        GOOD_HEAD,
      ),
    );

    const result = await services.seoCheck("example.org");

    expect(mocks.safeRequest.mock.calls[0][0]).toBe("https://example.org");
    expect(result).toMatchObject({
      url: "https://example.org",
      score: 100,
      issues: [],
      title: { length: 47 },
      canonical: "https://example.org/",
      openGraph: { title: "OG", description: "OGD", image: "i.png" },
      twitterCard: "summary",
      charset: "utf-8",
      language: "en",
      favicon: "/f.ico",
      headings: { h1: ["Heading"], h2: ["Sub"] },
      images: { total: 1, withAlt: 1, withoutAlt: 0 },
      links: { internal: 2, external: 1, nofollow: 1, total: 3 },
      schemaMarkup: ["Organization", "Unknown"],
    });
    expect(result.wordCount).toBeGreaterThan(3);
  });

  it("flags a page with nothing set, with severity-weighted score", async () => {
    mocks.safeRequest.mockResolvedValue(
      page('<img src="a.png"><img><img alt=" ">', "", "<html>"),
    );

    const result = await services.seoCheck("http://bare.test");

    expect(result.issues.map((issue) => issue.type)).toEqual([
      "title",
      "meta_description",
      "h1",
      "canonical",
      "viewport",
      "language",
      "images",
      "og",
      "favicon",
      "schema",
    ]);
    expect(result.images.missingAlt).toEqual(["a.png", "unknown", "unknown"]);
    expect(result.score).toBe(100 - (15 * 4 + 8 * 3 + 3 * 3));
  });

  it("flags long and short titles and descriptions, and several H1s", async () => {
    mocks.safeRequest.mockResolvedValueOnce(
      page(
        "<h1>One</h1><h1>Two</h1>",
        `<title>${"t".repeat(61)}</title><meta name="description" content="${"d".repeat(161)}">`,
      ),
    );
    const long = await services.seoCheck("https://example.org");
    expect(long.issues).toEqual(
      expect.arrayContaining([
        {
          type: "title",
          severity: "warning",
          message: "Title too long (61 chars, max 60)",
        },
        {
          type: "meta_description",
          severity: "warning",
          message: "Meta description too long (161 chars, max 160)",
        },
        {
          type: "h1",
          severity: "warning",
          message: "Multiple H1 tags found (2)",
        },
      ]),
    );

    mocks.safeRequest.mockResolvedValueOnce(
      page(
        "<h1>One</h1>",
        `<title>Short</title><meta name="description" content="short">`,
      ),
    );
    const short = await services.seoCheck("https://example.org");
    expect(short.issues).toEqual(
      expect.arrayContaining([
        {
          type: "title",
          severity: "info",
          message: "Title might be too short (5 chars)",
        },
        {
          type: "meta_description",
          severity: "info",
          message: "Meta description might be too short (5 chars)",
        },
      ]),
    );
  });

  it("reads the charset from an http-equiv Content-Type, and never scores below zero", async () => {
    mocks.safeRequest.mockResolvedValue(
      page(
        "",
        '<meta http-equiv="Content-Type" content="text/html; charset=latin1">',
        "<html>",
      ),
    );

    const result = await services.seoCheck("https://example.org");

    expect(result.charset).toBe("text/html; charset=latin1");
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});

describe("sparse markup", () => {
  it("treats an empty href as no link and an empty structured-data script as untyped", async () => {
    mocks.safeRequest.mockResolvedValue(
      page(
        '<a href="">empty</a><a href="/x">x</a>',
        '<script type="application/ld+json"></script>',
      ),
    );

    const seo = await services.seoCheck("https://example.org");
    const backlinks = await services.backlinkAnalyze("https://example.org");
    const traffic = await services.trafficAnalyze("https://example.org");
    const competitors = await services.competitorAnalyze("https://example.org");

    expect(seo.schemaMarkup).toEqual(["Unknown"]);
    expect(seo.links).toMatchObject({ total: 2, internal: 1 });
    expect(backlinks.internalLinks.total).toBe(1);
    expect(traffic.links.internalPages).toBe(1);
    expect(competitors.siteContext).toEqual({
      title: "",
      description: "",
      h1: "",
      keywords: "",
    });
  });

  it("does not fail on a link to the site written without a protocol", async () => {
    mocks.safeRequest.mockResolvedValue({
      ...page('<a href="example.org/contact">c</a>'),
      headers: {},
    });

    const traffic = await services.trafficAnalyze("https://example.org");

    expect(traffic.links.internalPages).toBe(1);
  });
});

describe("serpSimulator", () => {
  it("previews a result that fits", () => {
    const title = "t".repeat(40);
    const description = "d".repeat(100);

    const result = services.serpSimulator(
      title,
      description,
      "https://example.org/page",
    );

    expect(result.issues).toEqual([]);
    expect(result.score).toBe(100);
    expect(result.preview).toEqual({
      title,
      description,
      url: "https://example.org/page",
      displayUrl: "example.org",
    });
    expect(result.analysis.title.pixelWidth).toBe(320);
  });

  it("truncates and warns when everything is too long, or too short", () => {
    const long = services.serpSimulator(
      "t".repeat(70),
      "d".repeat(170),
      "example.org",
    );

    expect(long.preview.title).toBe(`${"t".repeat(57)}...`);
    expect(long.preview.description).toBe(`${"d".repeat(157)}...`);
    expect(long.issues.map((issue) => issue.message)).toEqual([
      "Title is 10 chars over the 60 char limit",
      "Description is 10 chars over the 160 char limit",
      "URL should include protocol (https://)",
    ]);
    expect(long.analysis.title.pixelWidth).toBe(560);

    const short = services.serpSimulator("t", "d", "https://a.test");
    expect(short.issues.map((issue) => issue.field)).toEqual([
      "title",
      "description",
    ]);
    expect(short.score).toBe(70);
  });

  it("caps the pixel width estimate at 600", () => {
    expect(
      services.serpSimulator("t".repeat(90), "d".repeat(100), "https://a.test")
        .analysis.title.pixelWidth,
    ).toBe(600);
  });
});

describe("text analysis", () => {
  const TEXT =
    "The quick brown fox jumps over the lazy dog. The quick brown fox jumps again today. Short one.";

  it("measures uniqueness and finds repeated four-word phrases", () => {
    const result = services.checkPlagiarism(TEXT);

    expect(result).toMatchObject({
      totalWords: 18,
      totalSentences: 2,
      averageWordsPerSentence: 9,
      readabilityLevel: "Easy",
    });
    expect(result.repeatedPhrases).toEqual([
      { phrase: "the quick brown fox", count: 2 },
      { phrase: "quick brown fox jumps", count: 2 },
    ]);
    expect(result.uniquenessScore).toBe(
      Math.round((result.uniqueWords / 18) * 100),
    );
  });

  it("rates long sentences as moderate or complex readability", () => {
    const moderate = services.checkPlagiarism(`${"word ".repeat(17)}.`);
    const complex = services.checkPlagiarism(`${"word ".repeat(25)}.`);

    expect(moderate.readabilityLevel).toBe("Moderate");
    expect(complex.readabilityLevel).toBe("Complex");
  });

  it("copes with text that has no full sentence", () => {
    const result = services.checkPlagiarism("hi there");

    expect(result.totalSentences).toBe(0);
    expect(result.averageWordsPerSentence).toBe(0);
  });

  it("summarises by picking the highest-scoring sentences", () => {
    const text =
      "Rockets use fuel to reach orbit around the planet. Fuel tanks hold most of the rocket mass. A cat sat on the mat today. Orbit needs high speed above everything.";

    const result = services.generateSummary(text, 2);

    expect(result).toMatchObject({ totalSentences: 4, summarySentences: 2 });
    expect(result.summary?.endsWith(".")).toBe(true);
    expect(result.summary).toContain("Fuel tanks hold most of the rocket mass");
    expect(result.summary).not.toContain("cat sat");
    expect(result.compressionRatio).toBe(
      Math.round((1 - result.summaryLength / text.length) * 100),
    );
  });

  it("returns short text unchanged", () => {
    expect(services.generateSummary("tiny")).toEqual({
      summary: "tiny",
      originalLength: 4,
      summaryLength: 4,
      sentences: 0,
    });
  });

  it("suggests how to improve a text, and defaults to a professional style", () => {
    const longSentence = `${"many ".repeat(30)}end`;
    const result = services.rewriteText(longSentence);

    expect(result.style).toBe("professional");
    expect(result.suggestions).toEqual([
      "Break long sentences into shorter ones",
      "Consider adding more detail",
      "Use more varied vocabulary",
      "Add commas for better readability",
    ]);
    expect(result.readability).toBe("Complex");

    const sentence = (n: number) =>
      `${Array.from({ length: 12 }, (_, i) => `w${n}x${i}`).join(" ")}, end`;
    const fine = services.rewriteText(
      `${[1, 2, 3, 4, 5].map((n) => sentence(n)).join(". ")}.`,
      "casual",
    );
    expect(fine.suggestions).toEqual([]);
    expect(fine.style).toBe("casual");
  });

  it("handles an empty rewrite request", () => {
    const result = services.rewriteText("");

    expect(result.averageSentenceLength).toBe(0);
    expect(result.wordCount).toBe(0);
  });
});

describe("generateGBPDescription", () => {
  it("writes three variants with the services and points", () => {
    const result = services.generateGBPDescription(
      "Acme",
      "bakery",
      "Pune",
      ["bread", "cakes"],
      ["Open late", "Family run"],
    );

    expect(result.descriptions).toHaveLength(3);
    expect(result.descriptions[0].text).toContain(
      "We specialize in bread, cakes. Open late. Family run.",
    );
    expect(result.descriptions.every((variant) => variant.isWithinLimit)).toBe(
      true,
    );
  });

  it("falls back to generic wording and flags an over-long variant", () => {
    const result = services.generateGBPDescription(
      "A".repeat(800),
      "shop",
      "Goa",
      [],
      [],
    );

    expect(result.descriptions[0].text).toContain("various services");
    expect(result.descriptions[0].isWithinLimit).toBe(false);
  });
});

describe("keywordSuggest", () => {
  it("merges the seed suggestions with modifier suggestions, once each", async () => {
    mocks.axiosGet.mockImplementation(async (url: string) => {
      if (url.endsWith("q=seo")) return { data: ["seo", ["seo tools", "seo"]] };
      if (url.includes("how%20to"))
        return { data: ["x", ["how to seo", "seo tools"]] };
      if (url.includes("best")) throw new Error("rate limited");
      if (url.includes("what%20is")) return { data: "not an array" };
      return { data: ["x", []] };
    });

    const result = await services.keywordSuggest(" seo ");

    expect(result.seed).toBe(" seo ");
    expect(result.keywords.map((entry) => entry.keyword)).toEqual([
      "seo tools",
      "seo",
      "how to seo",
    ]);
    expect(result.keywords[0]).toEqual({
      keyword: "seo tools",
      wordCount: 2,
      charCount: 9,
    });
    expect(result.totalSuggestions).toBe(3);
  });

  it("returns nothing when the seed answer is not in the expected shape", async () => {
    mocks.axiosGet.mockResolvedValue({ data: {} });

    await expect(services.keywordSuggest("x")).resolves.toMatchObject({
      totalSuggestions: 0,
    });
  });
});

describe("link analysis", () => {
  const LINKS = `
    <a href="/about">  About us </a>
    <a href="https://example.org/blog" rel="nofollow"></a>
    <a href="https://partner.test/a">Partner</a>
    <a href="https://partner.test/b" rel="nofollow noopener">Partner 2</a>
    <a href="https://other.test">Other</a>
    <a href="http://[bad">Broken</a>
    <a href="mailto:x@y.z">Mail</a>
    <a>no href</a>`;

  it("separates internal and external links with their domains", async () => {
    mocks.safeRequest.mockResolvedValue(page(LINKS));

    const result = await services.backlinkAnalyze("example.org");

    expect(result.domain).toBe("example.org");
    expect(result.internalLinks).toEqual({
      total: 2,
      links: [
        { url: "/about", anchor: "About us", nofollow: false },
        {
          url: "https://example.org/blog",
          anchor: "https://example.org/blog",
          nofollow: true,
        },
      ],
    });
    expect(result.externalLinks).toMatchObject({
      total: 3,
      dofollow: 2,
      nofollow: 1,
      uniqueDomains: 2,
      domainList: ["partner.test", "other.test"],
    });
    expect(result.externalLinks.links[0]).toEqual({
      url: "https://partner.test/a",
      anchor: "Partner",
      nofollow: false,
      domain: "partner.test",
    });
    expect(result.summary).toEqual({
      totalLinks: 5,
      internalCount: 2,
      externalCount: 3,
      uniqueExternalDomains: 2,
    });
  });

  it("uses the domain as the anchor of an image-only external link", async () => {
    mocks.safeRequest.mockResolvedValue(
      page('<a href="https://partner.test/"><img src="x"></a>'),
    );

    const result = await services.backlinkAnalyze("https://example.org");

    expect(result.externalLinks.links[0].anchor).toBe("partner.test");
  });

  it("analyses competitors from outgoing links, skipping social and utility domains", async () => {
    mocks.safeRequest.mockResolvedValue(
      page(
        `<h1>Headline</h1><a href="https://rival.test/a">Rival site</a>
         <a href="https://rival.test/b">${"x".repeat(80)}</a>
         <a href="https://rival.test/c">Third</a><a href="https://rival.test/d">Fourth</a>
         <a href="https://rival.test/e"></a>
         <a href="https://facebook.com/x">fb</a><a href="https://cdn.jsdelivr.net/lib">cdn</a>
         <a href="https://example.org/self">self</a><a href="https://minor.test">Minor</a>
         <a href="http://[broken">bad</a><a href="/relative">rel</a>`,
        `<title>My Site</title><meta name="description" content="About things"><meta name="keywords" content="k1,k2">`,
      ),
    );

    const result = await services.competitorAnalyze("example.org");

    expect(result.siteContext).toEqual({
      title: "My Site",
      description: "About things",
      h1: "Headline",
      keywords: "k1,k2",
    });
    expect(result.totalExternalDomains).toBe(2);
    expect(result.relatedSites).toEqual([
      {
        domain: "rival.test",
        mentions: 5,
        anchors: ["Rival site", "x".repeat(60), "Third"],
      },
      { domain: "minor.test", mentions: 1, anchors: ["Minor"] },
    ]);
  });
});

describe("trafficAnalyze", () => {
  it("measures the page, its links, social presence and technology", async () => {
    mocks.safeRequest.mockResolvedValue({
      ...page(
        `<h1>Hi</h1><img src="a"><iframe></iframe><p>${"word ".repeat(10)}</p>
         <a href="/a">a</a><a href="/a">a again</a><a href="https://example.org/b?x=1">b</a>
         <a href="example.org/c">c</a><a href="https://twitter.com/x">t</a><a href="https://instagram.com/x">i</a>
         <a href="https://twitter.com/y">t2</a><a href="https://partner.test/z">p</a><a href="http://[bad">bad</a>`,
        `<title>Traffic</title><meta name="description" content="D"><meta property="og:type" content="website">
         <meta name="generator" content="Astro"><link rel="stylesheet" href="s.css">
         <script src="https://www.googletagmanager.com/gtm.js"></script><script src="/gtag/js"></script>`,
      ),
      headers: { server: "nginx" },
    });

    const result = await services.trafficAnalyze("https://example.org");

    expect(result.performance).toMatchObject({
      scripts: 2,
      stylesheets: 1,
      images: 1,
      iframes: 1,
    });
    expect(result.content).toMatchObject({
      title: "Traffic",
      metaDescription: "D",
      wordCount: 14,
      internalPages: 3,
      externalDomains: 3,
    });
    expect(result.social).toEqual({
      platforms: ["twitter.com", "instagram.com"],
      count: 2,
    });
    expect(result.technology.detected).toEqual([
      "Astro",
      "Google Analytics",
      "Google Tag Manager",
      "Server: nginx",
    ]);
    expect(result.technology.ogType).toBe("website");
    expect(result.links.externalDomainList).toEqual([
      "twitter.com",
      "instagram.com",
      "partner.test",
    ]);
  });

  it("detects frameworks and platforms from the page source", async () => {
    mocks.safeRequest.mockResolvedValue({
      ...page(
        '<div id="__next">wp-content shopify angular vue cloudflare</div>',
        '<script src="/google-analytics.js"></script>',
      ),
      headers: {},
    });

    const result = await services.trafficAnalyze("https://example.org");

    expect(result.technology.detected).toEqual([
      "WordPress",
      "Shopify",
      "React",
      "Angular",
      "Vue.js",
      "Google Analytics",
      "Cloudflare",
    ]);
  });
});

describe("searchPlaces", () => {
  it("maps the first ten results", async () => {
    mocks.axiosGet.mockResolvedValue({
      data: {
        status: "OK",
        results: Array.from({ length: 12 }, (_, i) => ({
          name: `Place ${i}`,
          formatted_address: `Addr ${i}`,
          place_id: `id${i}`,
          ...(i === 0 ? { rating: 4.5, user_ratings_total: 120 } : {}),
        })),
      },
    });

    const result = await services.searchPlaces("bakery pune", "KEY");

    expect(mocks.axiosGet).toHaveBeenCalledWith(
      "https://maps.googleapis.com/maps/api/place/textsearch/json",
      { params: { query: "bakery pune", key: "KEY" }, timeout: 10000 },
    );
    expect(result.totalResults).toBe(10);
    expect(result.results[0]).toEqual({
      name: "Place 0",
      address: "Addr 0",
      placeId: "id0",
      rating: 4.5,
      totalReviews: 120,
    });
    expect(result.results[1]).toMatchObject({ rating: null, totalReviews: 0 });
  });

  it("accepts an empty result, and reports API errors with the provider's message", async () => {
    mocks.axiosGet.mockResolvedValueOnce({ data: { status: "ZERO_RESULTS" } });
    await expect(services.searchPlaces("x", "KEY")).resolves.toEqual({
      query: "x",
      totalResults: 0,
      results: [],
    });

    mocks.axiosGet.mockResolvedValueOnce({
      data: { status: "REQUEST_DENIED", error_message: "Bad key" },
    });
    await expect(services.searchPlaces("x", "KEY")).rejects.toThrow("Bad key");

    mocks.axiosGet.mockResolvedValueOnce({
      data: { status: "OVER_QUERY_LIMIT" },
    });
    await expect(services.searchPlaces("x", "KEY")).rejects.toThrow(
      "Google Places API error: OVER_QUERY_LIMIT",
    );
  });
});

describe("routes", () => {
  const post = (path: string, body: object) =>
    request(app).post(path).send(body);

  it("serves each analysis as data", async () => {
    mocks.safeRequest.mockResolvedValue(page("<h1>x</h1>", GOOD_HEAD));
    mocks.axiosGet.mockResolvedValue({ data: ["k", ["kw one"]] });

    const bodies: Array<[string, object]> = [
      ["/seo-check", { url: "https://example.org" }],
      [
        "/serp-simulator",
        { title: "T", description: "D", url: "https://a.test" },
      ],
      [
        "/plagiarism-check",
        {
          text: "One two three four five six. Seven eight nine ten eleven twelve.",
        },
      ],
      [
        "/summary",
        {
          text: "Alpha beta gamma delta epsilon zeta. Eta theta iota kappa lambda mu.",
          maxSentences: 1,
        },
      ],
      ["/rewrite", { text: "Plain text, short.", style: "casual" }],
      [
        "/gbp-description",
        { businessName: "A", businessType: "shop", location: "Goa" },
      ],
      ["/keyword-suggest", { keyword: "seo" }],
      ["/backlink-analyze", { url: "https://example.org" }],
      ["/traffic-analyze", { url: "https://example.org" }],
      ["/competitor-analyze", { url: "https://example.org" }],
    ];
    for (const [path, body] of bodies) {
      const res = await post(path, body);
      expect(res.status, path).toBe(200);
      expect(res.body.success, path).toBe(true);
    }
  });

  it("looks up places with a key, and asks for one when it is missing", async () => {
    mocks.axiosGet.mockResolvedValue({ data: { status: "ZERO_RESULTS" } });

    const ok = await post("/place-search", { query: "bakery", apiKey: "KEY" });
    const missing = await post("/place-search", { query: "bakery" });

    expect(ok.body).toEqual({
      success: true,
      data: { query: "bakery", totalResults: 0, results: [] },
    });
    expect(missing.status).toBe(400);
    expect(missing.body.error).toContain("Google Places API key is required");
  });

  it.each([
    ["/seo-check", { url: "https://example.org" }, "SEO check failed"],
    ["/keyword-suggest", { keyword: "seo" }, "Keyword suggestion failed"],
    [
      "/backlink-analyze",
      { url: "https://example.org" },
      "Backlink analysis failed",
    ],
    [
      "/traffic-analyze",
      { url: "https://example.org" },
      "Traffic analysis failed",
    ],
    [
      "/competitor-analyze",
      { url: "https://example.org" },
      "Competitor analysis failed",
    ],
    ["/place-search", { query: "x", apiKey: "k" }, "Place search failed"],
  ])(
    "POST %s answers 500 with a safe message when the lookup fails",
    async (path, body, message) => {
      vi.stubEnv("NODE_ENV", "production");
      mocks.safeRequest.mockRejectedValue(new Error("secret detail"));
      mocks.axiosGet.mockRejectedValue(new Error("secret detail"));

      const res = await post(path, body);
      vi.unstubAllEnvs();

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ success: false, error: message });
    },
  );

  it.each([
    ["/serp-simulator", "SERP simulation failed"],
    ["/plagiarism-check", "Plagiarism check failed"],
    ["/summary", "Summary generation failed"],
    ["/rewrite", "Text rewrite failed"],
    ["/gbp-description", "GBP description generation failed"],
  ])("POST %s answers 500 when the analysis throws", async (path, message) => {
    vi.stubEnv("NODE_ENV", "production");
    // A body whose fields throw when read: the controllers destructure it as given.
    const throwing = new Proxy(
      {},
      {
        get: () => {
          throw new Error("boom");
        },
      },
    );
    const controllers = await import("../controllers.js");
    const handlers: Record<string, (req: never, res: never) => void> = {
      "/serp-simulator": controllers.serpSimulatorController,
      "/plagiarism-check": controllers.plagiarismCheckerController,
      "/summary": controllers.summaryGeneratorController,
      "/rewrite": controllers.rewriteTextController,
      "/gbp-description": controllers.gbpDescriptionController,
    };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    handlers[path]({ body: throwing } as never, res as never);
    vi.unstubAllEnvs();

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: message });
  });

  it("rejects missing text and urls before analysing", async () => {
    const text = await post("/summary", { text: "" });
    const url = await post("/seo-check", { url: "example.org" });

    expect([text.status, url.status]).toEqual([400, 400]);
  });
});
