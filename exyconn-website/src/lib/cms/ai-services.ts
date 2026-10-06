import type { CmsBlock } from "@exyconn/cms";
import { getCmsPage, getCmsSite } from "./client";

/**
 * The AI service catalogue lives in the CMS: the /ai-services page's "aiservice.catalogue"
 * block holds every category and its service cards (each service's own page,
 * /ai-services/<slug>, holds its detail). The home page's catalogue, the sitemaps and the
 * {serviceCount} copy variable read the list from there, so adding a service in the editor
 * (a card on /ai-services and a page duplicated from another service) reaches all of them.
 */
export interface AiServiceCard {
  slug: string;
  title: string;
  summary: string;
  /** Font Awesome icon class, e.g. "fa-robot". */
  icon: string;
}

export interface AiServiceCategory {
  slug: string;
  title: string;
  description: string;
  icon: string;
  services: readonly AiServiceCard[];
}

export const AI_SERVICES_PATH = "/ai-services";
const CATALOGUE_KEY = "aiservice.catalogue";

function findCatalogue(blocks: readonly CmsBlock[]): CmsBlock | undefined {
  for (const block of blocks) {
    if (block.kind !== "component") {
      continue;
    }
    if (block.key === CATALOGUE_KEY) {
      return block;
    }
    const nested = findCatalogue(block.children);
    if (nested) {
      return nested;
    }
  }
  return undefined;
}

/** The catalogue's categories as published on the site's /ai-services page; none without it. */
export async function aiServiceCategories(siteId: string): Promise<AiServiceCategory[]> {
  const page = await getCmsPage(siteId, AI_SERVICES_PATH);
  const block = page ? findCatalogue(page.page.blocks) : undefined;
  if (block?.kind !== "component" || !Array.isArray(block.props.categories)) {
    return [];
  }
  return block.props.categories as AiServiceCategory[];
}

/** Every service of the catalogue, in listing order. */
export const allAiServices = (categories: readonly AiServiceCategory[]): AiServiceCard[] =>
  categories.flatMap((category) => category.services);

/**
 * The AI service pages' paths in listing order, for the sitemaps. Those also list every other
 * page, so when the CMS cannot be read they go out without these (the failure logged).
 */
export async function aiServicePaths(siteId: string | undefined): Promise<string[]> {
  if (!siteId) {
    return [];
  }
  try {
    const services = allAiServices(await aiServiceCategories(siteId));
    return services.map((service) => `${AI_SERVICES_PATH}/${service.slug}`);
  } catch (error) {
    console.error("The AI service catalogue could not be read from the CMS", error);
    return [];
  }
}

/** The AI service pages as sitemap links (title, path) for the site a host serves. */
export async function aiServiceLinks(host: string): Promise<{ label: string; href: string }[]> {
  try {
    const { site } = await getCmsSite(host);
    const services = allAiServices(await aiServiceCategories(site.id));
    return services.map((service) => ({
      label: service.title,
      href: `${AI_SERVICES_PATH}/${service.slug}`,
    }));
  } catch (error) {
    console.error("The AI service catalogue could not be read from the CMS", error);
    return [];
  }
}
