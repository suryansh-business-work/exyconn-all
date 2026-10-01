import { useEffect, useRef, type RefObject } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Moves focus to the page's main region whenever the path changes.
 *
 * A page change in an SPA moves nothing on its own: focus stays on the sidebar link that was
 * pressed, and a screen reader says only that it was pressed. Focusing the region makes the
 * browser announce the new page and start reading it from the top (WCAG 2.2 SC 2.4.3), and
 * scrolls a long page back to its heading.
 *
 * Left alone when focus is already inside the region: a tab strip changes the path too, and
 * taking focus off the tab just chosen would lose a keyboard user their place. Nothing is
 * done for the path the layout opened on.
 */
export function useFocusOnNavigate(region: RefObject<HTMLElement | null>): void {
  const { pathname } = useLocation();
  const openedAt = useRef(pathname);

  useEffect(() => {
    const element = region.current;
    if (!element || pathname === openedAt.current) return;
    if (!element.contains(document.activeElement)) {
      element.focus();
    }
  }, [pathname, region]);
}
