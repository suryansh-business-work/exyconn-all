import { getNewsletterIssues } from "../portal/newsletter";
import { getBlogStamps, getCaseStudyStamps } from "../portal/queries";
import { getCmsPaths, getCmsSite } from "./client";
import type { CmsSite } from "./types";

export interface PublishedPaths {
  site: CmsSite | null;
  /** Published page paths, home as "" (the sitemap's and llms.txt's spelling), then items. */
  paths: string[];
  /** When each path last changed (YYYY-MM-DD), for the sitemap's lastmod; absent when unknown. */
  lastmod: Record<string, string>;
}

/** One dated path: the path and the day it last changed. */
const dated = (path: string, stamp: string): [string, string] => [path, stamp.slice(0, 10)];

/**
 * The CMS pages published on the site this host serves, then its published blog posts
 * (/blog/<slug>), case studies (/case-studies/<slug>) and newsletter issues
 * (/newsletter/<slug>), each with the day it last changed, for the sitemap and llms.txt. Those
 * lists also name every hand-written page, so when the CMS cannot be reached they are served
 * without its pages (and the failure logged) rather than not at all.
 */
export async function publishedPaths(host: string): Promise<PublishedPaths> {
  try {
    const { site } = await getCmsSite(host);
    const [rows, posts, studies, issues] = await Promise.all([
      getCmsPaths(site.id),
      getBlogStamps(site.slug),
      getCaseStudyStamps(site.slug),
      getNewsletterIssues(site.slug),
    ]);
    const entries = [
      ...rows.map((row) => dated(row.path === "/" ? "" : row.path, row.updatedAt)),
      ...posts.map((post) => dated(`/blog/${post.slug}`, post.publishedAt)),
      ...studies.map((study) => dated(`/case-studies/${study.slug}`, study.publishedAt)),
      ...issues.map((issue) => dated(`/newsletter/${issue.slug}`, issue.publishedAt)),
    ];
    return {
      site,
      paths: entries.map(([path]) => path),
      lastmod: Object.fromEntries(entries.filter(([, day]) => day !== "")),
    };
  } catch (error) {
    console.error("CMS paths could not be read for the sitemap", error);
    return { site: null, paths: [], lastmod: {} };
  }
}

/** `base` followed by every path of `extra` it does not already hold, in order. */
export const withPaths = (base: readonly string[], extra: readonly string[]): string[] => [
  ...new Set([...base, ...extra]),
];
