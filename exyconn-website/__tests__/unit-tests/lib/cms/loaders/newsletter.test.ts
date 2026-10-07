/** The newsletter issue template's loader: the issue, a few earlier ones and its JSON-LD. */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { issueLoader, type IssueDetail } from "../../../../../src/lib/cms/loaders/newsletter";
import { getNewsletterIssue, getNewsletterIssues } from "../../../../../src/lib/portal";
import { issue } from "../fixtures";
import { loaderInput, SITE_URL } from "./input";

vi.mock("../../../../../src/lib/portal", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../../src/lib/portal")>()),
  getNewsletterIssue: vi.fn(),
  getNewsletterIssues: vi.fn(),
}));

const getIssue = vi.mocked(getNewsletterIssue);
const getIssues = vi.mocked(getNewsletterIssues);

beforeEach(() => {
  getIssue.mockReset();
  getIssues.mockReset();
});

describe("issueLoader", () => {
  it("is a 404 without a slug, without asking the portal", async () => {
    await expect(issueLoader(loaderInput({}))).resolves.toBeNull();
    expect(getIssue).not.toHaveBeenCalled();
    expect(getIssues).not.toHaveBeenCalled();
  });

  it("is a 404 when no issue lives at the slug", async () => {
    getIssue.mockResolvedValue(null);
    getIssues.mockResolvedValue([]);
    await expect(issueLoader(loaderInput({ slug: "gone" }))).resolves.toBeNull();
    expect(getIssue).toHaveBeenCalledWith("gone", "exyconn");
    expect(getIssues).toHaveBeenCalledWith("exyconn");
  });

  it("lists at most three earlier issues, never the issue itself", async () => {
    const current = issue({ slug: "october" });
    const others = ["september", "august", "july", "june"].map((slug) => issue({ slug }));
    getIssue.mockResolvedValue(current);
    getIssues.mockResolvedValue([current, ...others]);
    const load = await issueLoader(loaderInput({ slug: "october" }));
    const url = `${SITE_URL}/en-in/newsletter/october`;
    expect(load?.item).toEqual({
      issue: current,
      earlier: others.slice(0, 3),
      url,
    } satisfies IssueDetail);
    expect(load?.ogType).toBe("article");
    expect(load?.vars).toEqual({ title: "October issue", summary: "What shipped", coverImage: "" });
  });

  it("publishes an Article without an image when the issue has no cover", async () => {
    getIssue.mockResolvedValue(issue());
    getIssues.mockResolvedValue([]);
    const load = await issueLoader(loaderInput({ slug: "october" }));
    const [article, crumbs] = load?.jsonLd ?? [];
    expect(article).toMatchObject({ "@type": "Article", headline: "October issue", keywords: "" });
    expect(article).not.toHaveProperty("image");
    expect(crumbs).toMatchObject({ "@type": "BreadcrumbList" });
  });
});
