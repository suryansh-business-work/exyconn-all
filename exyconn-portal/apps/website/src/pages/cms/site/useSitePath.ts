import { useCallback } from 'react';
import { sitePath } from './site-paths';
import { useCurrentSite } from './site.context';

/** Builds paths inside the current site: `to('pages')` → /website/s/<site>/pages. */
export function useSitePath(): (rest?: string) => string {
  const { site } = useCurrentSite();
  return useCallback((rest = '') => sitePath(site.slug, rest), [site.slug]);
}
