import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { applyHeadTags, toTagList } from '@exyconn/seo';
import { metaForPath } from './routes';

/**
 * Keeps the live `<head>` equal to what the prerender baked for the current URL: on every
 * route change the same builder (`metaForPath`) runs and replaces the page meta.
 */
export function useRouteSeo(): void {
  const { pathname } = useLocation();
  useEffect(() => {
    applyHeadTags(document, toTagList(metaForPath(pathname)));
  }, [pathname]);
}
