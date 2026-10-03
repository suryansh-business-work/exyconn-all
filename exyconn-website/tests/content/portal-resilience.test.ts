/**
 * A portal outage must not 500 a page: every read query logs and resolves empty ([] / null),
 * while branding keeps its own fallback and mutations still throw. Also covers the dev-only
 * fixture hook that answers reads from tests/fixtures/portal.ts.
 */
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getBlogPost,
  getBlogPosts,
  getBranding,
  getCaseStudies,
  getCaseStudy,
  getGig,
  getGigs,
  getJob,
  getJobCompanies,
  getJobCompany,
  getJobs,
  getJobsWithCompanies,
  getNavLinks,
  getOpenGigs,
  getPublicPolicies,
  getPublicPolicy,
  getTool,
  getToolCategories,
  getTools,
} from "../../src/lib/portal/queries";
import { portalRequest } from "../../src/lib/portal/client";
import { answerPortalQuery, FIXTURE_POSTS, FIXTURE_TOOLS } from "../fixtures/portal";

const FIXTURES = fileURLToPath(new URL("../fixtures/portal.ts", import.meta.url));

describe("portal reads when the portal fails", () => {
  beforeEach(() => {
    vi.stubEnv("PUBLIC_PORTAL_GRAPHQL_URL", "https://portal.test/graphql");
    vi.stubEnv("PORTAL_FIXTURES", "");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("resolves every list to [] and logs", async () => {
    const lists = await Promise.all([
      getBlogPosts(),
      getCaseStudies(),
      getJobCompanies(),
      getJobs(),
      getJobsWithCompanies(),
      getGigs(),
      getOpenGigs(),
      getToolCategories(),
      getTools(),
      getNavLinks(),
      getPublicPolicies(),
    ]);
    lists.forEach((list) => expect(list).toEqual([]));
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("getBlogPosts failed"),
      expect.any(Error)
    );
  });

  it("resolves every single read to null", async () => {
    const singles = await Promise.all([
      getBlogPost("a"),
      getCaseStudy("a"),
      getJobCompany("a"),
      getJob("a"),
      getGig("a"),
      getTool("a"),
      getPublicPolicy("a"),
    ]);
    singles.forEach((one) => expect(one).toBeNull());
  });

  it("still throws for branding (getBrandingSafe owns that fallback) and for writes", async () => {
    await expect(getBranding()).rejects.toThrow("ECONNREFUSED");
    await expect(portalRequest("mutation { x }")).rejects.toThrow("ECONNREFUSED");
  });

  it("rejects a write on HTTP errors, GraphQL errors and empty payloads", async () => {
    const answer = (body: unknown, status = 200) =>
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }))
      );
    answer({}, 502);
    await expect(portalRequest("mutation { x }")).rejects.toThrow("HTTP 502");
    answer({
      errors: [
        { message: "Bad captcha", extensions: { code: "CAPTCHA_FAILED" } },
        { message: "x" },
      ],
    });
    await expect(portalRequest("mutation { x }")).rejects.toMatchObject({
      codes: ["CAPTCHA_FAILED", ""],
    });
    answer({});
    await expect(portalRequest("mutation { x }")).rejects.toThrow("returned no data");
  });

  it("needs the portal URL", async () => {
    vi.stubEnv("PUBLIC_PORTAL_GRAPHQL_URL", "");
    await expect(portalRequest("mutation { x }")).rejects.toThrow("PUBLIC_PORTAL_GRAPHQL_URL");
  });

  it("returns the data when the portal answers", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ data: { publicBlogPosts: FIXTURE_POSTS } }))
        )
    );
    await expect(getBlogPosts()).resolves.toHaveLength(FIXTURE_POSTS.length);
  });
});

describe("dev fixture hook", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("answers reads from the fixtures module when PORTAL_FIXTURES is set", async () => {
    vi.stubEnv("PORTAL_FIXTURES", FIXTURES);
    await expect(getTools("developer")).resolves.toHaveLength(
      FIXTURE_TOOLS.filter((tool) => tool.categorySlug === "developer").length
    );
    await expect(getTool("json-formatter")).resolves.toMatchObject({ name: "JSON formatter" });
    await expect(getBlogPost("missing")).resolves.toBeNull();
  });

  it("fails like the portal for anything it has no fixture for", () => {
    expect(() => answerPortalQuery("query { publicBranding { x } }", {})).toThrow(
      "No portal fixture for publicBranding"
    );
    expect(() => answerPortalQuery("nonsense", {})).toThrow("No portal fixture for ");
  });
});
