import { portalRequest } from "../portal/client";
import { cached, createTtlCache } from "./cache";
import type { CmsPath, CmsPublicPage, CmsPublicSite } from "./types";

/**
 * The website's reads of the CMS (the portal's public queries — no sign-in), server-side
 * only. Published content is cached for 30 seconds per host or per site and path, so an
 * editor's publish shows within half a minute; a preview is never cached.
 */
const TTL_MS = 30_000;
const MAX_ENTRIES = 500;

const FRAGMENT_FIELDS = "id blocks css";

const SITE_QUERY = `query CmsSite($host: String!) {
  publicCmsSite(host: $host) {
    site {
      id name slug domains isDefault markets defaultLocale faviconUrl
      seo { titleTemplate description ogImageUrl }
      headerFragmentId footerFragmentId headHtml bodyEndHtml globalCss
    }
    designSystem { id tokens extraCss }
    fragments { ${FRAGMENT_FIELDS} }
  }
}`;

const PAGE_QUERY = `query CmsPage($siteId: ID!, $path: String!, $previewToken: String) {
  publicCmsPage(siteId: $siteId, path: $path, previewToken: $previewToken) {
    page {
      id path kind title layout blocks css params preview
      seo { title description keywords ogImageUrl canonical noindex jsonLd }
    }
    fragments { ${FRAGMENT_FIELDS} }
  }
}`;

const PATHS_QUERY = `query CmsPaths($siteId: ID!) {
  publicCmsPaths(siteId: $siteId) { path updatedAt }
}`;

const sites = createTtlCache<CmsPublicSite>(TTL_MS, MAX_ENTRIES);
const pages = createTtlCache<CmsPublicPage | null>(TTL_MS, MAX_ENTRIES);
const paths = createTtlCache<CmsPath[]>(TTL_MS, MAX_ENTRIES);

/** A host as the cache keys it: lower-case, without the port. */
const hostKey = (host: string): string => host.toLowerCase().replace(/:\d+$/, "");

/** The site served at `host` (the portal answers the default site for an unknown host). */
export function getCmsSite(host: string): Promise<CmsPublicSite> {
  const key = hostKey(host);
  return cached(sites, key, async () => {
    const data = await portalRequest<{ publicCmsSite: CmsPublicSite }>(SITE_QUERY, { host: key });
    return data.publicCmsSite;
  });
}

async function fetchPage(
  siteId: string,
  path: string,
  previewToken: string | null
): Promise<CmsPublicPage | null> {
  const data = await portalRequest<{ publicCmsPage: CmsPublicPage | null }>(PAGE_QUERY, {
    siteId,
    path,
    previewToken,
  });
  return data.publicCmsPage;
}

/** The published page at `path` (or the template it fits); null when nothing lives there. */
export function getCmsPage(siteId: string, path: string): Promise<CmsPublicPage | null> {
  return cached(pages, `${siteId}:${path}`, () => fetchPage(siteId, path, null));
}

/** A page's draft through a preview link — never cached, so every reload shows the latest. */
export function getCmsPreview(siteId: string, token: string): Promise<CmsPublicPage | null> {
  return fetchPage(siteId, "/", token);
}

/** Every published page's path, for the sitemap and llms.txt. */
export function getCmsPaths(siteId: string): Promise<CmsPath[]> {
  return cached(paths, siteId, async () => {
    const data = await portalRequest<{ publicCmsPaths: CmsPath[] }>(PATHS_QUERY, { siteId });
    return data.publicCmsPaths;
  });
}
