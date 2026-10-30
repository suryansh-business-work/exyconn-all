/** The published CMS pages, posts, case studies and issues the sitemap and llms.txt list. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCmsPaths, getCmsSite } from "../../../../src/lib/cms/client";
import { publishedPaths, withPaths } from "../../../../src/lib/cms/paths";
import { getNewsletterIssues } from "../../../../src/lib/portal/newsletter";
import { getBlogStamps, getCaseStudyStamps } from "../../../../src/lib/portal/queries";
import { issue, publicSite } from "./fixtures";

vi.mock("../../../../src/lib/cms/client", () => ({ getCmsSite: vi.fn(), getCmsPaths: vi.fn() }));
vi.mock("../../../../src/lib/portal/newsletter", () => ({ getNewsletterIssues: vi.fn() }));
vi.mock("../../../../src/lib/portal/queries", () => ({
  getBlogStamps: vi.fn(),
  getCaseStudyStamps: vi.fn(),
}));

const site = vi.mocked(getCmsSite);
const paths = vi.mocked(getCmsPaths);
const issues = vi.mocked(getNewsletterIssues);
const posts = vi.mocked(getBlogStamps);
const studies = vi.mocked(getCaseStudyStamps);

beforeEach(() => {
  site.mockReset();
  paths.mockReset();
  issues.mockReset();
  posts.mockReset().mockResolvedValue([]);
  studies.mockReset().mockResolvedValue([]);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("publishedPaths", () => {
  it("lists the pages with home as an empty path, then posts, case studies and issues", async () => {
    const served = publicSite({ id: "site-7", slug: "acme" });
    site.mockResolvedValue(served);
    paths.mockResolvedValue([
      { path: "/", updatedAt: "2026-09-01" },
      { path: "/about", updatedAt: "2026-09-02" },
    ]);
    posts.mockResolvedValue([{ slug: "rag-explained", publishedAt: "2026-10-14T18:30:00.000Z" }]);
    studies.mockResolvedValue([{ slug: "clinic-bot", publishedAt: "" }]);
    issues.mockResolvedValue([issue({ slug: "october" }), issue({ slug: "september" })]);
    await expect(publishedPaths("acme.test")).resolves.toEqual({
      site: served.site,
      paths: [
        "",
        "/about",
        "/blog/rag-explained",
        "/case-studies/clinic-bot",
        "/newsletter/october",
        "/newsletter/september",
      ],
      lastmod: {
        "": "2026-09-01",
        "/about": "2026-09-02",
        "/blog/rag-explained": "2026-10-14",
        "/newsletter/october": "2026-10-01",
        "/newsletter/september": "2026-10-01",
      },
    });
    expect(site).toHaveBeenCalledWith("acme.test");
    expect(paths).toHaveBeenCalledWith("site-7");
    expect(issues).toHaveBeenCalledWith("acme");
    expect(posts).toHaveBeenCalledWith("acme");
    expect(studies).toHaveBeenCalledWith("acme");
  });

  it("logs and lists nothing when the CMS cannot be reached", async () => {
    site.mockRejectedValue(new Error("down"));
    await expect(publishedPaths("acme.test")).resolves.toEqual({
      site: null,
      paths: [],
      lastmod: {},
    });
    expect(console.error).toHaveBeenCalledWith(
      "CMS paths could not be read for the sitemap",
      expect.any(Error)
    );
  });

  it("lists nothing when reading the paths fails", async () => {
    site.mockResolvedValue(publicSite());
    paths.mockRejectedValue(new Error("down"));
    issues.mockResolvedValue([]);
    await expect(publishedPaths("acme.test")).resolves.toEqual({
      site: null,
      paths: [],
      lastmod: {},
    });
  });
});

describe("withPaths", () => {
  it("appends only the paths the base does not hold, in order", () => {
    expect(withPaths(["", "/a"], ["/b", "/a", "", "/c"])).toEqual(["", "/a", "/b", "/c"]);
    expect(withPaths([], [])).toEqual([]);
  });
});
