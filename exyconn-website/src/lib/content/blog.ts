import { getCollection, getEntry, render, type CollectionEntry } from "astro:content";
import { newestFirst } from "./helpers";
import type { BlogPost, RenderedBody } from "./types";

function toBlogPost(entry: CollectionEntry<"blog">): BlogPost {
  return { slug: entry.id, ...entry.data, publishedAt: entry.data.publishedAt.toISOString() };
}

/** Every blog post, newest first. */
export async function getBlogPosts(): Promise<BlogPost[]> {
  const entries = await getCollection("blog");
  return entries.map(toBlogPost).toSorted(newestFirst);
}

/** One post with its rendered body, or null when no document has that slug. */
export async function getBlogPost(
  slug: string
): Promise<{ post: BlogPost; Content: RenderedBody } | null> {
  const entry = await getEntry("blog", slug);
  if (!entry) {
    return null;
  }
  const { Content } = await render(entry);
  return { post: toBlogPost(entry), Content };
}
