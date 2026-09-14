import { useEffect } from 'react';

/**
 * The app's own name, exactly as `index.html` shipped it from the app registry
 * ("HR · Exyconn Track") — read once, before any page has changed it.
 */
const SITE_TITLE = globalThis.document?.title ?? '';

/**
 * Titles the browser tab for the page on screen (WCAG 2.2 SC 2.4.2).
 *
 * Without it a whole portal shared one tab title, which is the first thing a screen reader
 * announces and the only thing a person with ten tabs open can tell them apart by.
 */
export function usePageTitle(heading: string): void {
  useEffect(() => {
    globalThis.document.title = SITE_TITLE ? `${heading} · ${SITE_TITLE}` : heading;
  }, [heading]);
}
