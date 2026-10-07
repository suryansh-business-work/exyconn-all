import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const portalRequest = vi.hoisted(() => vi.fn());
vi.mock("../../../../src/lib/portal/client", () => ({ portalRequest }));

import {
  getBlogPost,
  getBlogPosts,
  getCaseStudies,
  getCaseStudy,
  getGig,
  getGigs,
  getJob,
  getJobCompanies,
  getJobCompany,
  getJobs,
  getNavLinks,
  getPublicPolicies,
  getPublicPolicy,
  getTool,
  getToolCategories,
  getTools,
} from "../../../../src/lib/portal/queries";

interface ReadCase {
  label: string;
  run: () => Promise<unknown>;
  field: string;
  variables: Record<string, unknown> | undefined;
  empty: [] | null;
}

const READS: ReadCase[] = [
  {
    label: "getBlogPosts",
    run: () => getBlogPosts("exyconn"),
    field: "publicBlogPosts",
    variables: { site: "exyconn" },
    empty: [],
  },
  {
    label: "getBlogPost",
    run: () => getBlogPost("hello", "exyconn"),
    field: "publicBlogPost",
    variables: { slug: "hello", site: "exyconn" },
    empty: null,
  },
  {
    label: "getCaseStudies",
    run: () => getCaseStudies(),
    field: "publicCaseStudies",
    variables: { site: undefined },
    empty: [],
  },
  {
    label: "getCaseStudy",
    run: () => getCaseStudy("acme"),
    field: "publicCaseStudy",
    variables: { slug: "acme", site: undefined },
    empty: null,
  },
  {
    label: "getJobCompanies",
    run: () => getJobCompanies("s"),
    field: "publicJobCompanies",
    variables: { site: "s" },
    empty: [],
  },
  {
    label: "getJobCompany",
    run: () => getJobCompany("acme", "s"),
    field: "publicJobCompany",
    variables: { slug: "acme", site: "s" },
    empty: null,
  },
  {
    label: "getJobs",
    run: () => getJobs("acme", "s"),
    field: "publicJobs",
    variables: { companySlug: "acme", site: "s" },
    empty: [],
  },
  {
    label: "getJob",
    run: () => getJob("JOB-1", "s"),
    field: "publicJob",
    variables: { jobCode: "JOB-1", site: "s" },
    empty: null,
  },
  {
    label: "getGigs",
    run: () => getGigs("s"),
    field: "publicGigs",
    variables: { site: "s" },
    empty: [],
  },
  {
    label: "getGig",
    run: () => getGig("GIG-1", "s"),
    field: "publicGig",
    variables: { gigCode: "GIG-1", site: "s" },
    empty: null,
  },
  {
    label: "getToolCategories",
    run: () => getToolCategories(),
    field: "publicToolCategories",
    variables: undefined,
    empty: [],
  },
  {
    label: "getTools",
    run: () => getTools("developer"),
    field: "publicTools",
    variables: { categorySlug: "developer" },
    empty: [],
  },
  {
    label: "getTool",
    run: () => getTool("json"),
    field: "publicTool",
    variables: { toolCode: "json" },
    empty: null,
  },
  {
    label: "getNavLinks",
    run: () => getNavLinks(),
    field: "publicNavLinks",
    variables: undefined,
    empty: [],
  },
  {
    label: "getPublicPolicies",
    run: () => getPublicPolicies(),
    field: "publicPolicies",
    variables: undefined,
    empty: [],
  },
  {
    label: "getPublicPolicy",
    run: () => getPublicPolicy("privacy"),
    field: "publicPolicy",
    variables: { slug: "privacy" },
    empty: null,
  },
];

beforeEach(() => {
  portalRequest.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("portal read queries", () => {
  it.each(READS)("$label asks for $field and returns it", async ({ run, field, variables }) => {
    const rows = { [field]: [{ id: "row-1" }] };
    portalRequest.mockResolvedValue(rows);

    await expect(run()).resolves.toBe(rows[field]);
    const [query, sent] = portalRequest.mock.calls[0];
    expect(query).toContain(field);
    expect(sent).toEqual(variables);
  });

  it.each(READS)(
    "$label renders empty and logs when the portal fails",
    async ({ label, run, empty }) => {
      const failure = new Error("portal down");
      portalRequest.mockRejectedValue(failure);

      await expect(run()).resolves.toEqual(empty);
      expect(console.error).toHaveBeenCalledWith(
        `Portal ${label} failed — rendering without it.`,
        failure
      );
    }
  );

  it("returns null for a detail the portal has not published", async () => {
    portalRequest.mockResolvedValue({ publicBlogPost: null });
    await expect(getBlogPost("missing")).resolves.toBeNull();
    expect(console.error).not.toHaveBeenCalled();
  });
});
