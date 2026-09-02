import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Blog posts and case studies are markdown documents edited through TinaCMS. The schemas
 * here mirror the Tina collections in `tina/collections`, so every document the editor
 * accepts is guaranteed to render; defaults cover the optional fields.
 */

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    author: z.object({
      name: z.string(),
      role: z.string().default(""),
      initials: z.string().default(""),
    }),
    publishedAt: z.coerce.date(),
    readTime: z.string().default(""),
    tags: z.array(z.string()).default([]),
    coverImage: z.string(),
    featured: z.boolean().default(false),
  }),
});

const caseStudies = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/case-studies" }),
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    category: z.string(),
    author: z.string().default("Exyconn"),
    publishedAt: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    coverImage: z.string(),
    pdfUrl: z.string().default(""),
    featured: z.boolean().default(false),
  }),
});

export const collections = { blog, caseStudies };
