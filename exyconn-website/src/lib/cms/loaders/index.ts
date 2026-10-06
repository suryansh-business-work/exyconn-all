import type { CmsBlock, CmsComponentKey } from "@exyconn/cms";
import { DEFAULT_MARKET, type Market } from "../../i18n/markets";
import type { CmsPageData, CmsRenderContext, CmsSite } from "../types";
import { blogArticleLoader } from "./blog";
import { caseStudyLoader } from "./case-studies";
import { companyLoader, gigLoader, jobLoader } from "./career";
import { crumbsLoader } from "./crumbs";
import { issueLoader } from "./newsletter";
import { policyListLoader, policyLoader } from "./policies";
import { toolLoader } from "./tools";
import type { PageLoad, PageLoader, PageLoadInput } from "./types";

export type { PageLoad, PageLoader, PageLoadInput } from "./types";

/**
 * The components whose page reads something before it renders (see PageLoad): a template's
 * item — missing means the page is a 404 — or structured data built from the component's props.
 */
const PAGE_LOADERS: Partial<Record<CmsComponentKey, PageLoader>> = {
  "blog.list": crumbsLoader,
  "blog.article": blogArticleLoader,
  "casestudy.list": crumbsLoader,
  "casestudy.article": caseStudyLoader,
  "career.index": crumbsLoader,
  "career.gigs": crumbsLoader,
  "career.gig": gigLoader,
  "career.company": companyLoader,
  "career.job": jobLoader,
  "tools.list": crumbsLoader,
  "tools.detail": toolLoader,
  "policy.list": policyListLoader,
  "policy.detail": policyLoader,
  "newsletter.list": crumbsLoader,
  "newsletter.issue": issueLoader,
};

const loaderOf = (key: string): PageLoader | undefined =>
  Object.hasOwn(PAGE_LOADERS, key) ? PAGE_LOADERS[key as CmsComponentKey] : undefined;

/** The first component of the tree (depth first) that has a loader, with its props. */
function firstLoaded(
  blocks: readonly CmsBlock[]
): { key: string; loader: PageLoader; props: Record<string, unknown> } | null {
  for (const block of blocks) {
    if (block.kind !== "component") {
      continue;
    }
    const loader = loaderOf(block.key);
    if (loader) {
      return { key: block.key, loader, props: block.props };
    }
    const nested = firstLoaded(block.children);
    if (nested) {
      return nested;
    }
  }
  return null;
}

/**
 * What the page needs read before it renders: the loader of its first loading component, or
 * nothing to read. Null means the page's item does not exist — render the 404.
 */
export async function loadCmsPage(
  page: CmsPageData,
  input: Omit<PageLoadInput, "props" | "params">
): Promise<PageLoad | null> {
  const found = firstLoaded(page.blocks);
  if (!found) {
    return {};
  }
  const load = await found.loader({ ...input, props: found.props, params: page.params });
  return load && { ...load, source: found.key };
}

/**
 * The item a component's loader read for this page, or null (logged) when the page's loader
 * belongs to another component — e.g. a second template component dropped on the same page.
 */
export function detailOf<T>(cms: CmsRenderContext, key: CmsComponentKey): T | null {
  if (cms.detail?.key === key) {
    return cms.detail.item as T;
  }
  console.warn(`CMS component "${key}" has no item to show on this page; it was skipped.`);
  return null;
}

/** Where a request is served: the market the middleware resolved and astro.config's `site`. */
export interface RouteInput {
  market: Market | undefined;
  astroSite: URL | undefined;
}

/** The loader input for a page of `site` served to this request. */
export function routeLoadInput(
  site: CmsSite,
  route: RouteInput
): Omit<PageLoadInput, "props" | "params"> {
  const ownDomain = !site.markets && site.domains.length > 0;
  const siteUrl = ownDomain
    ? `https://${site.domains[0]}`
    : (route.astroSite?.toString() ?? "https://exyconn.com/").replace(/\/$/, "");
  return { site: site.slug, market: route.market ?? DEFAULT_MARKET, siteUrl };
}
