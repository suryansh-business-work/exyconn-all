/** The case study template's loader: the story, its SEO values and its JSON-LD. */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  caseStudyLoader,
  type CaseStudyDetail,
} from "../../../../../src/lib/cms/loaders/case-studies";
import { getCaseStudy } from "../../../../../src/lib/portal";
import { caseStudy } from "../fixtures";
import { loaderInput, SITE_URL } from "./input";

vi.mock("../../../../../src/lib/portal", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../../src/lib/portal")>()),
  getCaseStudy: vi.fn(),
}));

const getStudy = vi.mocked(getCaseStudy);

beforeEach(() => {
  getStudy.mockReset();
});

describe("caseStudyLoader", () => {
  it("is a 404 without a slug or a story", async () => {
    await expect(caseStudyLoader(loaderInput({}))).resolves.toBeNull();
    expect(getStudy).not.toHaveBeenCalled();
    getStudy.mockResolvedValue(null);
    await expect(caseStudyLoader(loaderInput({ slug: "gone" }))).resolves.toBeNull();
    expect(getStudy).toHaveBeenCalledWith("gone", "exyconn");
  });

  it("reads the story at its market URL with its SEO values", async () => {
    const study = caseStudy();
    getStudy.mockResolvedValue(study);
    const load = await caseStudyLoader(loaderInput({ slug: "claims" }));
    const url = `${SITE_URL}/en-in/case-studies/claims`;
    expect(load?.item).toEqual({ study, url } satisfies CaseStudyDetail);
    expect(load?.ogType).toBe("article");
    expect(load?.vars).toEqual({
      title: "Claims triage",
      summary: "Cut triage time by 62%.",
      tags: "AI",
      coverImage: "https://cdn.test/claims.png",
    });
  });

  it("publishes an Article by the organisation in the story's industry", async () => {
    getStudy.mockResolvedValue(caseStudy());
    const load = await caseStudyLoader(loaderInput({ slug: "claims" }));
    const [article, crumbs] = load?.jsonLd ?? [];
    expect(article).toMatchObject({
      "@type": "Article",
      image: "https://cdn.test/claims.png",
      articleSection: "Insurance",
      author: { "@type": "Organization", url: SITE_URL },
      url: `${SITE_URL}/en-in/case-studies/claims`,
    });
    expect(crumbs).toMatchObject({ "@type": "BreadcrumbList" });
  });
});
