import { TOOLS_SITE_URL } from "../site";
import type { BlogPost, Gig, Job, JobCompany, Tool } from "./types";

/**
 * Presentation helpers that used to live alongside the hardcoded data files. They
 * operate on portal content and hold no data of their own.
 */

/** "2 January 2026" — matches the format the blog and case-study cards used. */
export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** "Posted 3 days ago" style relative label used on job cards. */
export function getDaysAgo(value: string): string {
  const days = Math.floor((Date.now() - Date.parse(value)) / 86_400_000);

  if (days <= 0) {
    return "Today";
  }
  if (days === 1) {
    return "Yesterday";
  }
  if (days < 30) {
    return `${days} days ago`;
  }

  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

/** Gig category -> number of open gigs in it. */
export function getGigCategoriesWithCounts(gigs: Gig[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const gig of gigs) {
    counts[gig.category] = (counts[gig.category] ?? 0) + 1;
  }
  return counts;
}

/** Card summary for the careers index: company plus how many jobs it is advertising. */
export interface CompanySummary {
  id: string;
  name: string;
  slug: string;
  logo: string;
  tagline: string;
  industry: string;
  brandColor: string;
  activeJobCount: number;
}

export function getCompanySummaries(companies: JobCompany[], jobs: Job[]): CompanySummary[] {
  return companies.map((company) => ({
    id: company.companyCode,
    name: company.name,
    slug: company.slug,
    logo: company.logo,
    tagline: company.tagline,
    industry: company.industry,
    brandColor: company.brandColor,
    activeJobCount: jobs.filter((job) => job.companySlug === company.slug).length,
  }));
}

/** Every distinct tag across the given posts, alphabetically — powers the blog filters. */
export function getAllTags(posts: BlogPost[]): string[] {
  const tags = new Set(posts.flatMap((post) => post.tags));
  return [...tags].toSorted((a, b) => a.localeCompare(b));
}

/** True when the portal row names a slug the standalone tools app serves. */
export function isToolAppSlug(tool: Pick<Tool, "url">): boolean {
  return tool.url.startsWith("/tools/");
}

/**
 * Where "open this tool" should actually send someone.
 *
 * `/our-tools` is the portal-driven marketing directory and `tools.exyconn.com` is the app
 * that runs the tools — two catalogues that coexist by decision. A portal Tool row records
 * the app path (`/tools/<slug>`), and this site 301s every `/tools/*` URL to the tools home
 * page, so linking the raw value would drop the slug. Resolving it against the tools domain
 * keeps the deep link; any other value is already an address in its own right.
 */
export function getToolLaunchUrl(tool: Pick<Tool, "url">): string {
  return isToolAppSlug(tool) ? `${TOOLS_SITE_URL}${tool.url}` : tool.url;
}
