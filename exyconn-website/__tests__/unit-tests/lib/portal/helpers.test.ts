import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatDate,
  getAllTags,
  getCompanySummaries,
  getDaysAgo,
  getGigCategoriesWithCounts,
  getToolLaunchUrl,
  isToolAppSlug,
} from "../../../../src/lib/portal/helpers";
import type { BlogPost } from "../../../../src/lib/portal/types";
import { company, gig, job } from "../career/fixtures";

describe("dates on cards", () => {
  it("writes a date the way the blog cards do", () => {
    expect(formatDate("2026-01-02T12:00:00Z")).toBe("January 2, 2026");
  });
});

describe("relative job dates", () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date("2026-10-07T12:00:00Z") });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("says today for today and for a date not yet reached", () => {
    expect(getDaysAgo("2026-10-07T08:00:00Z")).toBe("Today");
    expect(getDaysAgo("2026-10-09T08:00:00Z")).toBe("Today");
  });

  it("counts days for the first month", () => {
    expect(getDaysAgo("2026-10-06T08:00:00Z")).toBe("Yesterday");
    expect(getDaysAgo("2026-10-02T12:00:00Z")).toBe("5 days ago");
    expect(getDaysAgo("2026-09-08T12:00:00Z")).toBe("29 days ago");
  });

  it("counts months after that", () => {
    expect(getDaysAgo("2026-09-07T12:00:00Z")).toBe("1 month ago");
    expect(getDaysAgo("2026-07-09T12:00:00Z")).toBe("3 months ago");
  });
});

describe("collections", () => {
  it("counts open gigs per category", () => {
    const gigs = [gig({ category: "Design" }), gig({ category: "Writing" }), gig()];
    expect(getGigCategoriesWithCounts(gigs)).toEqual({ Design: 2, Writing: 1 });
    expect(getGigCategoriesWithCounts([])).toEqual({});
  });

  it("summarises each company with how many jobs it advertises", () => {
    const companies = [
      company({ companyCode: "ACME", slug: "acme", name: "Acme", industry: "AI" }),
      company({ companyCode: "BETA", slug: "beta", name: "Beta" }),
    ];
    const jobs = [job(), job({ jobCode: "JOB-2" }), job({ companySlug: "other" })];

    expect(getCompanySummaries(companies, jobs)).toEqual([
      {
        id: "ACME",
        name: "Acme",
        slug: "acme",
        logo: "",
        tagline: "",
        industry: "AI",
        brandColor: "",
        activeJobCount: 2,
      },
      {
        id: "BETA",
        name: "Beta",
        slug: "beta",
        logo: "",
        tagline: "",
        industry: "",
        brandColor: "",
        activeJobCount: 0,
      },
    ]);
  });

  it("lists every distinct tag alphabetically", () => {
    const posts = [{ tags: ["ai", "Cloud"] }, { tags: ["automation", "ai"] }] as BlogPost[];
    expect(getAllTags(posts)).toEqual(["ai", "automation", "Cloud"]);
  });
});

describe("tool links", () => {
  it("recognises a path the tools app serves", () => {
    expect(isToolAppSlug({ url: "/tools/json-formatter" })).toBe(true);
    expect(isToolAppSlug({ url: "https://example.com/tool" })).toBe(false);
  });

  it("deep-links app tools on the tools domain and prints other addresses only when safe", () => {
    expect(getToolLaunchUrl({ url: "/tools/json-formatter" })).toBe(
      "https://tools.exyconn.com/tools/json-formatter"
    );
    expect(getToolLaunchUrl({ url: "https://example.com/tool" })).toBe("https://example.com/tool");
    expect(getToolLaunchUrl({ url: "javascript:alert(1)" })).toBe("");
  });
});
