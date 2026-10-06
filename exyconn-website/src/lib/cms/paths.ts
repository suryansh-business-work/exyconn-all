import { getCmsPaths, getCmsSite } from "./client";
import type { CmsSite } from "./types";

export interface PublishedPaths {
  site: CmsSite | null;
  /** Published page paths, home as "" (the sitemap's and llms.txt's spelling). */
  paths: string[];
}

/**
 * The CMS pages published on the site this host serves, for the sitemap and llms.txt. Those
 * lists also name every hand-written page, so when the CMS cannot be reached they are served
 * without its pages (and the failure logged) rather than not at all.
 */
export async function publishedPaths(host: string): Promise<PublishedPaths> {
  try {
    const { site } = await getCmsSite(host);
    const rows = await getCmsPaths(site.id);
    return { site, paths: rows.map((row) => (row.path === "/" ? "" : row.path)) };
  } catch (error) {
    console.error("CMS paths could not be read for the sitemap", error);
    return { site: null, paths: [] };
  }
}

/** `base` followed by every path of `extra` it does not already hold, in order. */
export const withPaths = (base: readonly string[], extra: readonly string[]): string[] => [
  ...new Set([...base, ...extra]),
];
