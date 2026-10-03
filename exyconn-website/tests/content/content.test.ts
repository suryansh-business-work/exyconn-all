/**
 * Shaping for the portal-content pages (blog, case studies, tools, sitemap, 404): pure
 * functions over portal rows. The populated cases use the local fixtures; empty cases use [].
 */
import { describe, expect, it } from "vitest";
import {
  ARTICLE_COPY,
  articleSheets,
  BLOG_COPY,
  blogConstellation,
  GENERIC_CONSTELLATION,
  leadPost,
  relatedPosts,
} from "../../src/lib/content/blog";
import {
  CASE_STUDIES_COPY,
  extractMetrics,
  listTerrain,
  storyMetrics,
  storyTerrain,
} from "../../src/lib/content/case-studies";
import {
  absoluteAsset,
  chipOptions,
  displayDate,
  filterTokens,
  marketCrumbs,
  marketPageUrl,
  sortableDate,
} from "../../src/lib/content/format";
import { NOT_FOUND_COPY, NOT_FOUND_LINKS } from "../../src/lib/content/not-found";
import {
  pageCount,
  SITE_ROUTES,
  SITEMAP_COPY,
  sitemapSections,
  treeBranches,
} from "../../src/lib/content/sitemap";
import { articleJsonLd } from "../../src/lib/content/structured-data";
import {
  cssColor,
  cubeCount,
  monogram,
  toolCatalogue,
  TOOLS_COPY,
} from "../../src/lib/content/tools";
import { marketByPath } from "../../src/lib/i18n/markets";
import {
  FIXTURE_NAV_LINKS,
  FIXTURE_POSTS,
  FIXTURE_STUDIES,
  FIXTURE_TOOL_CATEGORIES,
  FIXTURE_TOOLS,
} from "../fixtures/portal";

const enIn = marketByPath("en-in");
if (!enIn) {
  throw new Error("en-in market missing from the registry");
}

describe("format", () => {
  it("formats a date in the market's locale and keeps the ISO value", () => {
    expect(displayDate("2026-09-03T10:00:00.000Z", "en-GB")).toEqual({
      iso: "2026-09-03T10:00:00.000Z",
      text: "3 September 2026",
    });
    expect(displayDate("2026-09-03T10:00:00.000Z", "en-US").text).toBe("September 3, 2026");
    expect(displayDate("not a date", "en-US")).toEqual({ iso: "not a date", text: "" });
  });

  it("builds market-correct absolute URLs and crumbs", () => {
    expect(marketPageUrl("https://exyconn.com/", enIn, "/blog/x")).toBe(
      "https://exyconn.com/en-in/blog/x"
    );
    expect(
      marketCrumbs(
        [
          { label: "Home", href: "/" },
          { label: "Section" },
          { label: "Blog", href: "/blog" },
          { label: "Post" },
        ],
        enIn,
        "https://exyconn.com/en-in/blog/x"
      )
    ).toEqual([
      { label: "Home", href: "/en-in" },
      { label: "Section" },
      { label: "Blog", href: "/en-in/blog" },
      { label: "Post", href: "https://exyconn.com/en-in/blog/x" },
    ]);
  });

  it("makes asset URLs absolute, leaving absolute, data and empty ones alone", () => {
    expect(absoluteAsset("https://exyconn.com/", "/og.png")).toBe("https://exyconn.com/og.png");
    expect(absoluteAsset("https://exyconn.com", "og.png")).toBe("https://exyconn.com/og.png");
    expect(absoluteAsset("https://exyconn.com", "https://cdn.test/a.png")).toBe(
      "https://cdn.test/a.png"
    );
    expect(absoluteAsset("https://exyconn.com", "data:image/png;base64,AA")).toMatch(/^data:/);
    expect(absoluteAsset("https://exyconn.com", "")).toBe("");
  });

  it("turns labels into filter tokens and ranked chip options", () => {
    expect(filterTokens(["AI agents", "Data & analytics"])).toBe("ai-agents data-analytics");
    expect(chipOptions(["B", "A", "B", "C", "A", "B"], 2)).toEqual([
      { value: "b", label: "B" },
      { value: "a", label: "A" },
    ]);
    expect(chipOptions(["Beta", "Alpha"], 5).map((option) => option.label)).toEqual([
      "Alpha",
      "Beta",
    ]);
  });

  it("gives dates a sortable number, 0 when unreadable", () => {
    expect(sortableDate("2026-09-03T23:00:00.000Z")).toBe(20260903);
    expect(sortableDate("")).toBe(0);
  });
});

describe("blog", () => {
  it("clusters real posts by first tag and links posts that share a tag", () => {
    const { groups, links } = blogConstellation(FIXTURE_POSTS);
    expect(groups.reduce((a, b) => a + b, 0)).toBe(FIXTURE_POSTS.length);
    expect(groups.length).toBeGreaterThan(1);
    expect(links.length).toBeGreaterThan(0);
    links.forEach(([a, b]) => expect(a).toBeLessThan(b));
  });

  it("groups untagged posts together and caps links", () => {
    const untagged = FIXTURE_POSTS.map((post) => ({ ...post, tags: [] }));
    expect(blogConstellation(untagged)).toEqual({ groups: [untagged.length], links: [] });
    const many = Array.from({ length: 30 }, (_, i) => ({ ...FIXTURE_POSTS[0], slug: `p${i}` }));
    expect(blogConstellation(many).links).toHaveLength(120);
  });

  it("falls back to the generic constellation with no posts", () => {
    expect(blogConstellation([])).toEqual({ groups: [...GENERIC_CONSTELLATION], links: [] });
  });

  it("leads with a featured post, else the newest", () => {
    expect(leadPost(FIXTURE_POSTS)?.featured).toBe(true);
    const plain = FIXTURE_POSTS.map((post) => ({ ...post, featured: false }));
    expect(leadPost(plain)).toBe(plain[0]);
    expect(leadPost([])).toBeUndefined();
  });

  it("relates posts by shared tags, then recency, never the post itself", () => {
    const [first] = FIXTURE_POSTS;
    const related = relatedPosts(first, FIXTURE_POSTS);
    expect(related).toHaveLength(3);
    expect(related.map((post) => post.slug)).not.toContain(first.slug);
    expect(related[0].tags.some((tag) => first.tags.includes(tag))).toBe(true);
    expect(relatedPosts(first, [first])).toEqual([]);
  });

  it("stacks one sheet per top-level section, 2 to 8", () => {
    expect(articleSheets([])).toBe(2);
    expect(articleSheets([{ level: 2 }, { level: 3 }, { level: 2 }, { level: 2 }])).toBe(3);
    expect(articleSheets(Array.from({ length: 12 }, () => ({ level: 2 as const })))).toBe(8);
  });

  it("keeps outcome-led titles of at most eight words", () => {
    [
      BLOG_COPY.title,
      CASE_STUDIES_COPY.title,
      TOOLS_COPY.heading,
      SITEMAP_COPY.title,
      NOT_FOUND_COPY.title,
    ].forEach((title) => expect(title.split(" ").length).toBeLessThanOrEqual(8));
    expect(ARTICLE_COPY.toc).not.toBe("");
  });
});

describe("case studies", () => {
  it("pulls the stated percentages and multipliers with their clause", () => {
    expect(
      extractMetrics(
        "An AI agent pre-sorts claims, cutting triage time by 62% and freeing 3 adjusters. Applications rose 3x after launch; costs fell 1,200.5 × overall"
      )
    ).toEqual([
      { value: "62%", amount: 62, label: "Cutting triage time" },
      { value: "3x", amount: 3, label: "Applications rose after launch" },
      { value: "1,200.5x", amount: 1200.5, label: "Costs fell overall" },
    ]);
    expect(extractMetrics("No numbers here.")).toEqual([]);
    expect(extractMetrics("a 1% b, c 2% d, e 3% f", 2)).toHaveLength(2);
    const long = `${"word ".repeat(30)}50%`;
    expect(extractMetrics(long)[0].label.endsWith("…")).toBe(true);
  });

  it("reads a story's metrics from its excerpt", () => {
    expect(storyMetrics(FIXTURE_STUDIES[0]).map((m) => m.value)).toEqual(["62%"]);
  });

  it("builds the list terrain from headline metrics, featured first", () => {
    expect(listTerrain(FIXTURE_STUDIES)).toEqual([62, 28, 19, 3]);
  });

  it("falls back to stories per industry, then a flat floor", () => {
    const plain = FIXTURE_STUDIES.map((study) => ({ ...study, excerpt: "No numbers." }));
    expect(listTerrain([...plain, { ...plain[0], id: "x" }])).toEqual([2, 1, 1, 1, 1]);
    expect(listTerrain([])).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it("gives a story its own bars, or a flat floor", () => {
    expect(storyTerrain(extractMetrics("up 40%, down 10%"))).toEqual([40, 10]);
    expect(storyTerrain([])).toHaveLength(8);
  });
});

describe("tools", () => {
  it("orders the catalogue by category then tool, counting populated categories", () => {
    const empty = { ...FIXTURE_TOOL_CATEGORIES[0], id: "e", slug: "empty", order: 0 };
    const { categories, entries } = toolCatalogue(
      [...FIXTURE_TOOL_CATEGORIES].reverse().concat(empty),
      FIXTURE_TOOLS.toReversed()
    );
    expect(categories.map(({ category }) => category.slug)).toEqual([
      "ai-writing",
      "developer",
      "brand",
    ]);
    expect(categories.map(({ count }) => count)).toEqual([3, 3, 2]);
    expect(entries[0].tool.toolCode).toBe("ai-blog-title-generator");
    expect(entries).toHaveLength(8);
    expect(toolCatalogue([], FIXTURE_TOOLS)).toEqual({ categories: [], entries: [] });
  });

  it("counts cubes up to twelve, generic when empty", () => {
    expect(cubeCount(8)).toBe(8);
    expect(cubeCount(40)).toBe(12);
    expect(cubeCount(0)).toBeUndefined();
  });

  it("accepts only plain CSS colours", () => {
    expect(cssColor("#7c3aed")).toBe("#7c3aed");
    expect(cssColor(" rgb(6, 182, 212) ")).toBe("rgb(6, 182, 212)");
    expect(cssColor("teal")).toBe("teal");
    expect(cssColor("")).toBe("");
    expect(cssColor("red; background: url(x)")).toBe("");
    expect(cssColor("#12345")).toBe("");
  });

  it("makes a two-letter mark from the name", () => {
    expect(monogram("AI blog title generator")).toBe("AB");
    expect(monogram("  regex ")).toBe("R");
  });
});

describe("sitemap", () => {
  it("groups the portal's safe links by category", () => {
    const sections = sitemapSections(FIXTURE_NAV_LINKS);
    expect(sections.map((section) => section.label)).toEqual([
      "General",
      "AI",
      "Services",
      "Case Studies",
      "Company",
    ]);
    expect(
      sections.flatMap((s) => s.links).some((link) => link.href.startsWith("javascript"))
    ).toBe(false);
    expect(pageCount(sections)).toBe(9);
    expect(sections[0].links[0]).toEqual({ label: "Home", href: "/", description: "Start here." });
    const noDescription = sitemapSections([{ ...FIXTURE_NAV_LINKS[0], description: "" }]);
    expect(noDescription[0].links[0].description).toBeUndefined();
  });

  it("falls back to the site's own routes, never the retired products page", () => {
    const sections = sitemapSections([]);
    expect(sections).toEqual(SITE_ROUTES);
    const hrefs = sections.flatMap((section) => section.links.map((link) => link.href));
    expect(hrefs).toContain("/our-tools");
    expect(hrefs).not.toContain("/our-products");
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("feeds the tree at most 12 sections of 24 pages", () => {
    expect(treeBranches(SITE_ROUTES)).toEqual(SITE_ROUTES.map((s) => Math.min(24, s.links.length)));
    const wide = Array.from({ length: 14 }, () => SITE_ROUTES[0]);
    expect(treeBranches(wide)).toHaveLength(12);
  });
});

describe("404", () => {
  it("links only to routes the site serves", () => {
    const served = new Set(
      SITE_ROUTES.flatMap((section) => section.links.map((link) => link.href))
    );
    NOT_FOUND_LINKS.forEach((link) => expect(served.has(link.href)).toBe(true));
    expect(served.has(NOT_FOUND_COPY.secondary.href)).toBe(true);
  });
});

describe("article JSON-LD", () => {
  const publisher = {
    name: "Exyconn",
    url: "https://exyconn.com",
    logo: "https://exyconn.com/f.svg",
  };

  it("describes a post with its author, image and market URL", () => {
    const ld = articleJsonLd({
      type: "BlogPosting",
      headline: "H",
      description: "D",
      image: "https://exyconn.com/a.png",
      published: "2026-09-03",
      url: "https://exyconn.com/en-in/blog/h",
      keywords: ["AI", "Agents"],
      section: "AI",
      author: "Ada",
      publisher,
    });
    expect(ld).toMatchObject({
      "@type": "BlogPosting",
      image: "https://exyconn.com/a.png",
      articleSection: "AI",
      author: { "@type": "Person", name: "Ada" },
      mainEntityOfPage: { "@id": "https://exyconn.com/en-in/blog/h" },
      keywords: "AI, Agents",
    });
  });

  it("falls back to the organisation as author and omits empty fields", () => {
    const ld = articleJsonLd({
      type: "Article",
      headline: "H",
      description: "D",
      image: "",
      published: "2026-09-03",
      url: "https://exyconn.com/en-us/case-studies/h",
      keywords: [],
      publisher,
    });
    expect(ld).not.toHaveProperty("image");
    expect(ld).not.toHaveProperty("articleSection");
    expect(ld.author).toEqual({
      "@type": "Organization",
      name: "Exyconn",
      url: "https://exyconn.com",
    });
  });
});
