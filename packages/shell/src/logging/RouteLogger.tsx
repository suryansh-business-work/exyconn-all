import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { portalLogger } from './portalLogger';

/** Tells Tech > Logs which page is open, so every error names it and the pages before it. */
export function RouteLogger() {
  const { pathname } = useLocation();
  useEffect(() => {
    portalLogger.setRoute(pathname);
  }, [pathname]);
  return null;
}
