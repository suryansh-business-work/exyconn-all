/** The published CMS pages and newsletter issues the sitemap and llms.txt list. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCmsPaths, getCmsSite } from "../../../../src/lib/cms/client";
import { publishedPaths, withPaths } from "../../../../src/lib/cms/paths";
import { getNewsletterIssues } from "../../../../src/lib/portal/newsletter";
import { issue, publicSite } from "./fixtures";

vi.mock("../../../../src/lib/cms/client", () => ({ getCmsSite: vi.fn(), getCmsPaths: vi.fn() }));
vi.mock("../../../../src/lib/portal/newsletter", () => ({ getNewsletterIssues: vi.fn() }));

const site = vi.mocked(getCmsSite);
const paths = vi.mocked(getCmsPaths);
const issues = vi.mocked(getNewsletterIssues);

beforeEach(() => {
  site.mockReset();
  paths.mockReset();
  issues.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("publishedPaths", () => {
  it("lists the pages with home as an empty path, then the issues", async () => {
    const served = publicSite({ id: "site-7", slug: "acme" });
    site.mockResolvedValue(served);
    paths.mockResolvedValue([
      { path: "/", updatedAt: "2026-09-01" },
      { path: "/about", updatedAt: "2026-09-02" },
    ]);
    issues.mockResolvedValue([issue({ slug: "october" }), issue({ slug: "september" })]);
    await expect(publishedPaths("acme.test")).resolves.toEqual({
      site: served.site,
      paths: ["", "/about", "/newsletter/october", "/newsletter/september"],
    });
    expect(site).toHaveBeenCalledWith("acme.test");
    expect(paths).toHaveBeenCalledWith("site-7");
    expect(issues).toHaveBeenCalledWith("acme");
  });

  it("logs and lists nothing when the CMS cannot be reached", async () => {
    site.mockRejectedValue(new Error("down"));
    await expect(publishedPaths("acme.test")).resolves.toEqual({ site: null, paths: [] });
    expect(console.error).toHaveBeenCalledWith(
      "CMS paths could not be read for the sitemap",
      expect.any(Error)
    );
  });

  it("lists nothing when reading the paths fails", async () => {
    site.mockResolvedValue(publicSite());
    paths.mockRejectedValue(new Error("down"));
    issues.mockResolvedValue([]);
    await expect(publishedPaths("acme.test")).resolves.toEqual({ site: null, paths: [] });
  });
});

describe("withPaths", () => {
  it("appends only the paths the base does not hold, in order", () => {
    expect(withPaths(["", "/a"], ["/b", "/a", "", "/c"])).toEqual(["", "/a", "/b", "/c"]);
    expect(withPaths([], [])).toEqual([]);
  });
});
