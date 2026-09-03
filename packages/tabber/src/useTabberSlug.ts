import { useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { resolveSlug } from './resolveSlug';

/** The active tab and the way to change it. */
export interface TabberSlug {
  slug: string;
  selectSlug: (slug: string) => void;
}

/**
 * Holds the active tab in the URL instead of component state.
 *
 * Selecting a tab pushes `${basePath}/${slug}`, so the back button walks tabs
 * and a link to one opens on it. Landing on the bare base path (or on a slug
 * that no longer exists) rewrites the URL to the first tab with `replace`, so
 * the correction never becomes a history entry of its own.
 *
 * Use this directly when the page renders its own body from the active tab; use
 * `Tabber` when each tab simply has its own panel.
 */
export function useTabberSlug(basePath: string, slugs: readonly string[]): TabberSlug {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const { slug, needsRedirect } = resolveSlug(pathname, basePath, slugs);

  useEffect(() => {
    if (needsRedirect) {
      navigate({ pathname: `${basePath}/${slug}`, search, hash }, { replace: true });
    }
  }, [needsRedirect, navigate, basePath, slug, search, hash]);

  const selectSlug = useCallback(
    (next: string) => navigate({ pathname: `${basePath}/${next}`, search, hash }),
    [navigate, basePath, search, hash],
  );

  return { slug, selectSlug };
}
