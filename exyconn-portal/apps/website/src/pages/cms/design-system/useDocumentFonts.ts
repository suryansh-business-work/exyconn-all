import { useEffect } from 'react';

/**
 * Loads fonts into the portal page itself, so a family can be previewed in its own face: a
 * stylesheet link (Google css2) and @font-face rules (uploads). Both are removed when the
 * inputs change or the screen closes.
 */
export function useDocumentFonts(stylesheetUrl: string, fontFaceCss = ''): void {
  useEffect(() => {
    if (!stylesheetUrl) return undefined;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = stylesheetUrl;
    document.head.append(link);
    return () => link.remove();
  }, [stylesheetUrl]);

  useEffect(() => {
    if (!fontFaceCss) return undefined;
    const style = document.createElement('style');
    style.textContent = fontFaceCss;
    document.head.append(style);
    return () => style.remove();
  }, [fontFaceCss]);
}
