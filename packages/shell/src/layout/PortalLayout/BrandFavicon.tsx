import { useBrandMark } from '@/hooks/useBrandMark';
import { useDocumentFavicon } from '@/hooks/useDocumentFavicon';

/** Points the browser-tab icon at the branding favicon for the current colour mode. */
export function BrandFavicon() {
  useDocumentFavicon(useBrandMark());
  return null;
}
