import { getCollection, getEntry, render, type CollectionEntry } from "astro:content";
import { newestFirst } from "./helpers";
import type { CaseStudy, RenderedBody } from "./types";

function toCaseStudy(entry: CollectionEntry<"caseStudies">): CaseStudy {
  return { slug: entry.id, ...entry.data, publishedAt: entry.data.publishedAt.toISOString() };
}

/** Every case study, newest first. */
export async function getCaseStudies(): Promise<CaseStudy[]> {
  const entries = await getCollection("caseStudies");
  return entries.map(toCaseStudy).toSorted(newestFirst);
}

/** One case study with its rendered body, or null when no document has that slug. */
export async function getCaseStudy(
  slug: string
): Promise<{ caseStudy: CaseStudy; Content: RenderedBody } | null> {
  const entry = await getEntry("caseStudies", slug);
  if (!entry) {
    return null;
  }
  const { Content } = await render(entry);
  return { caseStudy: toCaseStudy(entry), Content };
}
