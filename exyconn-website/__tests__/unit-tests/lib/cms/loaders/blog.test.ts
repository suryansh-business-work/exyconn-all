/** The blog article template's loader: the post, its related posts, SEO values and JSON-LD. */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { blogArticleLoader, type BlogArticleDetail } from "../../../../../src/lib/cms/loaders/blog";
import { BRANDING_FALLBACK, getBlogPost, getBlogPosts } from "../../../../../src/lib/portal";
import { blogPost } from "../fixtures";
import { CRUMBS, loaderInput, SITE_URL } from "./input";

vi.mock("../../../../../src/lib/portal", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../../src/lib/portal")>()),
  getBlogPost: vi.fn(),
  getBlogPosts: vi.fn(),
}));

const getPost = vi.mocked(getBlogPost);
const getPosts = vi.mocked(getBlogPosts);

beforeEach(() => {
  getPost.mockReset();
  getPosts.mockReset();
});

describe("blogArticleLoader", () => {
  it("is a 404 without a slug, without asking the portal", async () => {
    await expect(blogArticleLoader(loaderInput({}))).resolves.toBeNull();
    expect(getPost).not.toHaveBeenCalled();
  });

  it("is a 404 when the site has no post at the slug", async () => {
    getPost.mockResolvedValue(null);
    await expect(blogArticleLoader(loaderInput({ slug: "gone" }))).resolves.toBeNull();
    expect(getPost).toHaveBeenCalledWith("gone", "exyconn");
    expect(getPosts).not.toHaveBeenCalled();
  });

  it("reads the post with related posts at its market URL", async () => {
    const post = blogPost();
    const other = blogPost({ slug: "other", tags: ["AI"] });
    getPost.mockResolvedValue(post);
    getPosts.mockResolvedValue([post, other]);
    const load = await blogArticleLoader(loaderInput({ slug: "hello" }));
    const url = `${SITE_URL}/en-in/blog/hello`;
    expect(getPosts).toHaveBeenCalledWith("exyconn");
    expect(load?.item).toEqual({ post, related: [other], url } satisfies BlogArticleDetail);
    expect(load?.ogType).toBe("article");
    expect(load?.vars).toEqual({
      title: "Hello",
      summary: "A first post",
      tags: "AI, Agents",
      coverImage: "/covers/hello.png",
    });
  });

  it("publishes a BlogPosting and the market breadcrumb trail", async () => {
    getPost.mockResolvedValue(blogPost());
    getPosts.mockResolvedValue([]);
    const load = await blogArticleLoader(loaderInput({ slug: "hello" }));
    const [article, crumbs] = load?.jsonLd ?? [];
    expect(article).toMatchObject({
      "@type": "BlogPosting",
      headline: "Hello",
      image: `${SITE_URL}/covers/hello.png`,
      articleSection: "AI",
      author: { "@type": "Person", name: "Ada" },
      keywords: "AI, Agents",
      publisher: {
        name: BRANDING_FALLBACK.businessName,
        logo: { url: `${SITE_URL}${BRANDING_FALLBACK.faviconUrl}` },
      },
    });
    expect(crumbs).toMatchObject({ "@type": "BreadcrumbList" });
    expect(crumbs.itemListElement).toHaveLength(CRUMBS.length + 1);
  });
});
