/**
 * Blog list and article shaping: the knowledge-constellation scene from the real posts, the
 * topic chips, related posts, and the page copy. Posts come from the portal; nothing here
 * holds article content.
 */
import type { TocEntry } from "../inner/headings";
import type { BlogPost } from "../portal/types";

/** Shown when there are no posts yet: a quiet, generic constellation (decoration, not data). */
export const GENERIC_CONSTELLATION = [18, 14, 22, 16] as const;
const MAX_LINKS = 120;
const MAX_SHEETS = 8;

export interface Constellation {
  groups: number[];
  links: [number, number][];
}

/**
 * Each post a star, clustered by its first tag (untagged posts share one cluster), with a
 * line between every two posts that share a tag. Empty → the generic constellation.
 */
export const blogConstellation = (posts: readonly BlogPost[]): Constellation => {
  if (posts.length === 0) {
    return { groups: [...GENERIC_CONSTELLATION], links: [] };
  }
  const clusters = new Map<string, BlogPost[]>();
  posts.forEach((post) => {
    const key = post.tags[0] ?? "";
    clusters.set(key, [...(clusters.get(key) ?? []), post]);
  });
  // Stars are numbered cluster by cluster, the order the sampler places them in.
  const stars = [...clusters.values()].flat();
  const links: [number, number][] = [];
  stars.forEach((a, i) => {
    stars.slice(i + 1).forEach((b, offset) => {
      if (links.length < MAX_LINKS && a.tags.some((tag) => b.tags.includes(tag))) {
        links.push([i, i + 1 + offset]);
      }
    });
  });
  return { groups: [...clusters.values()].map((cluster) => cluster.length), links };
};

/** The post shown as the wide lead card: the newest one marked featured, else the newest. */
export const leadPost = (posts: readonly BlogPost[]): BlogPost | undefined =>
  posts.find((post) => post.featured) ?? posts[0];

/** Up to `count` other posts, those sharing the most tags first, then the newest. */
export const relatedPosts = (post: BlogPost, posts: readonly BlogPost[], count = 3): BlogPost[] => {
  const shared = (other: BlogPost) => other.tags.filter((tag) => post.tags.includes(tag)).length;
  return posts
    .filter((other) => other.slug !== post.slug)
    .map((other, order) => ({ other, order, score: shared(other) }))
    .toSorted((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, count)
    .map(({ other }) => other);
};

/** The article band's document stack: one sheet per top-level section (2–8). */
export const articleSheets = (toc: readonly Pick<TocEntry, "level">[]): number =>
  Math.min(MAX_SHEETS, Math.max(2, toc.filter((entry) => entry.level === 2).length));

export const BLOG_COPY = {
  metaTitle: "Blog | AI Insights & Tech Trends | Exyconn",
  metaDescription:
    "Read the latest articles, guides, and trends on AI automation, SaaS, and digital transformation from Exyconn's team. Stay ahead with actionable insights.",
  metaKeywords:
    "Exyconn blog, AI insights, SaaS trends, digital innovation, automation, business technology",
  crumb: "Blog",
  title: "Insights on AI and modern software",
  lede: "Articles, guides and field notes from the team that builds and runs it.",
  countTemplate: "{shown} of {total} articles",
  filterLabel: "Filter articles",
  sheetLabel: "Topics",
  topicLabel: "Topic",
  allTopics: "All topics",
  searchLabel: "Search articles",
  searchPlaceholder: "Title, topic or summary",
  sortLabel: "Sort",
  sortNewest: "Newest",
  sortOldest: "Oldest",
  chapterLabel: "Articles",
  chapterTitle: "Latest from the team",
  featured: "Featured",
  read: "Read article",
  noMatch: "No article matches those filters.",
  clear: "Clear filters",
  emptyLabel: "Nothing published yet",
  emptyTitle: "The first articles are being written",
  emptyText:
    "Our team publishes guides and field notes here. Until the first one lands, see what we build or read how it went for clients.",
  emptyPrimary: { label: "Explore AI", href: "/ai" },
  emptySecondary: { label: "Case studies", href: "/case-studies" },
  ctaLabel: "Work with us",
  ctaTitle: "Turn an idea into a working system",
  ctaText: "Tell us what you are trying to automate or build. We reply within 24 hours.",
  ctaPrimary: { label: "Get a quote", href: "/get-a-quote" },
  ctaSecondary: { label: "Contact", href: "/contact" },
} as const;

export const ARTICLE_COPY = {
  home: "Home",
  blog: "Blog",
  toc: "On this page",
  by: "Written by",
  share: "Share this article",
  shareX: "Share on X",
  shareLinkedIn: "Share on LinkedIn",
  copy: "Copy link",
  copied: "Link copied",
  copyFailed: "Copy failed — select the address bar instead",
  tags: "Topics",
  relatedLabel: "Keep reading",
  relatedTitle: "Related articles",
  read: "Read article",
  ctaLabel: "Work with us",
  ctaTitle: "Put these ideas to work",
  ctaPrimary: { label: "Get a quote", href: "/get-a-quote" },
  ctaSecondary: { label: "All articles", href: "/blog" },
} as const;
