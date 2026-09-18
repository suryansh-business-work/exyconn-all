import { useEffect } from 'react';
import { useBrandMark } from '@/hooks/useBrandMark';

/**
 * Points the browser-tab icon at the branding favicon for the current colour mode. The
 * shared Vite config ships the default `<link rel="icon">`; this only swaps its address.
 */
export function BrandFavicon() {
  const href = useBrandMark();
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link) link.href = href;
  }, [href]);
  return null;
}
