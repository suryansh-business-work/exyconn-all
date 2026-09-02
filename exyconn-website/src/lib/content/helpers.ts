import type { BlogPost } from "./types";

/** Sort comparator: most recently published first. */
export function newestFirst(a: { publishedAt: string }, b: { publishedAt: string }): number {
  return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
}

export function getFeaturedPosts(posts: BlogPost[]): BlogPost[] {
  return posts.filter((post) => post.featured);
}

export function getRegularPosts(posts: BlogPost[]): BlogPost[] {
  return posts.filter((post) => !post.featured);
}

/** Every distinct tag across the given posts, alphabetically. */
export function getAllTags(posts: BlogPost[]): string[] {
  const tags = new Set(posts.flatMap((post) => post.tags));
  return [...tags].toSorted((a, b) => a.localeCompare(b));
}

export function getPostsByTag(posts: BlogPost[], tag: string): BlogPost[] {
  return posts.filter((post) => post.tags.includes(tag));
}
