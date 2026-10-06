import { createContext, useContext } from 'react';
import type { CmsSiteFieldsFragment } from '@exyconn/shell/graphql/generated';

export type CmsSite = CmsSiteFieldsFragment;

/** The website a /website/s/:siteSlug/… page works on, and the others it can switch to. */
export interface CurrentSite {
  site: CmsSite;
  sites: readonly CmsSite[];
  /** Re-reads the sites after one is changed. */
  refetchSites: () => Promise<unknown>;
}

export const SiteContext = createContext<CurrentSite | null>(null);

/** The current website. Only pages under the site layout may ask. */
export function useCurrentSite(): CurrentSite {
  const current = useContext(SiteContext);
  if (!current) {
    throw new Error('useCurrentSite must be used under the site layout');
  }
  return current;
}

/**
 * The current website's id, or undefined outside a site page. For forms that file a record
 * under the site and may also be mounted on their own (component specs).
 */
export function useCurrentSiteId(): string | undefined {
  return useContext(SiteContext)?.site.id;
}
