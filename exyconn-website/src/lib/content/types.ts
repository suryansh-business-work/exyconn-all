import type { render } from "astro:content";

/**
 * Blog posts and case studies are markdown documents under `src/content/`, edited through
 * TinaCMS (schema in `tina/collections`) and read through Astro's content collections
 * (`src/content.config.ts`). These are the shapes the pages render.
 */

export interface BlogAuthor {
  name: string;
  role: string;
  initials: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  summary: string;
  author: BlogAuthor;
  readTime: string;
  tags: string[];
  coverImage: string;
  featured: boolean;
  /** ISO 8601 timestamp. */
  publishedAt: string;
}

export interface CaseStudy {
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  category: string;
  author: string;
  tags: string[];
  pdfUrl: string;
  featured: boolean;
  /** ISO 8601 timestamp. */
  publishedAt: string;
}

/** The `<Content />` component Astro produces for a document's markdown body. */
export type RenderedBody = Awaited<ReturnType<typeof render>>["Content"];
