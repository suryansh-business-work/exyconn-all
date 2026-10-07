/** filledSeo: a CMS page's head values with the site's and the loader's placeholders filled. */
import { describe, expect, it } from "vitest";
import { filledSeo } from "../../../../../src/lib/cms/loaders/seo";
import type { CmsPageSeo, CmsSiteSeo } from "../../../../../src/lib/cms/types";

const SITE_SEO: CmsSiteSeo = {
  titleTemplate: "%s | Exyconn",
  description: "Across {serviceCount} services",
  ogImageUrl: "/site-og.png",
};

const page = (seo: Partial<CmsPageSeo>, title = "Blog") => ({
  title,
  seo: {
    title: "",
    description: "",
    keywords: "",
    ogImageUrl: "",
    canonical: "",
    noindex: false,
    jsonLd: null,
    ...seo,
  },
});

describe("filledSeo", () => {
  it("falls back to the page title and the site's description and image", () => {
    expect(filledSeo(page({}), SITE_SEO, {}, { serviceCount: "12" })).toEqual({
      title: "Blog",
      description: "Across 12 services",
      keywords: "",
      metaImage: "/site-og.png",
      jsonLd: undefined,
    });
  });

  it("fills the page's own values, the loader's variables winning", () => {
    const seo = filledSeo(
      page({
        title: "{title} | Blog",
        description: "{summary} ({serviceCount})",
        keywords: "{tags}, AI",
        ogImageUrl: "{coverImage}",
      }),
      SITE_SEO,
      {
        vars: {
          title: "Hello",
          summary: "First",
          tags: "a, b",
          coverImage: "/c.png",
          serviceCount: "9",
        },
      },
      { serviceCount: "12" }
    );
    expect(seo).toMatchObject({
      title: "Hello | Blog",
      description: "First (9)",
      keywords: "a, b, AI",
      metaImage: "/c.png",
    });
  });

  it("drops keywords a blank value left empty, and uses the site's copy for a blank description", () => {
    const seo = filledSeo(
      page({ keywords: "a, {tags}, b,", description: "  {summary}  " }),
      SITE_SEO,
      { vars: { tags: "", summary: "" } },
      { serviceCount: "3" }
    );
    expect(seo.keywords).toBe("a, b");
    expect(seo.description).toBe("Across 3 services");
  });

  it("puts the page's filled JSON-LD before the loader's", () => {
    const seo = filledSeo(
      page({ jsonLd: { "@type": "WebPage", url: "{siteUrl}/blog" } }),
      SITE_SEO,
      { jsonLd: [{ "@type": "BreadcrumbList" }] },
      { siteUrl: "https://exyconn.com" }
    );
    expect(seo.jsonLd).toEqual([
      { "@type": "WebPage", url: "https://exyconn.com/blog" },
      { "@type": "BreadcrumbList" },
    ]);
  });

  it("reads a list of page nodes and ignores JSON-LD that is not an object", () => {
    expect(
      filledSeo(page({ jsonLd: [{ "@type": "A" }, { "@type": "B" }] }), SITE_SEO, {}, {}).jsonLd
    ).toEqual([{ "@type": "A" }, { "@type": "B" }]);
    expect(filledSeo(page({ jsonLd: "text" }), SITE_SEO, {}, {}).jsonLd).toBeUndefined();
  });
});
