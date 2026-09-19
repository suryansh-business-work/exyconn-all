import { useEffect } from 'react';

/**
 * Points the browser-tab icon at `href`. The shared Vite config ships the default
 * `<link rel="icon">`; this only swaps its address, so an empty or failed branding read
 * leaves the default in place.
 */
export function useDocumentFavicon(href: string): void {
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link && href) link.href = href;
  }, [href]);
}
