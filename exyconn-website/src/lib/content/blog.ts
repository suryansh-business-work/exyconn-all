/**
 * Blog list and article shaping: the knowledge-constellation scene from the real posts, the
 * related posts and the article's document stack. Posts come from the portal and the page copy
 * from the CMS (blog.list / blog.article); nothing here holds content.
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
