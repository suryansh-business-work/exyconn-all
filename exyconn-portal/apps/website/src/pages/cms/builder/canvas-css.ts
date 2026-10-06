import { PLACEHOLDER_CSS } from '@exyconn/live-editor';
import { lightTokensCss, readTokens } from '../design-system/design-tokens';
import { fontFaceCss, googleSourcesUrl } from '../design-system/font-sources';

/** The website's type face, loaded into the canvas like the live site loads it. */
export const WEBSITE_FONT_STYLESHEET =
  'https://fonts.googleapis.com/css2?family=Inter+Tight:ital,wght@0,100..900;1,100..900&display=swap';

/** Base rules the website's layout gives every page: its font and colour roles. */
const PAGE_BASE = `body {
  font-family: var(--font-family-sans, "Inter Tight", sans-serif);
  color: var(--color-fg);
  background-color: var(--color-page);
}
img { max-width: 100%; height: auto; }`;

interface CanvasCssInput {
  tokens: unknown;
  extraCss: string;
  globalCss: string;
}

/**
 * Everything the canvas needs to look like the live site: the design system as custom
 * properties, its extra CSS, the site's global CSS, and the placeholder cards' own look.
 */
export function canvasCss({ tokens, extraCss, globalCss }: CanvasCssInput): string {
  const design = readTokens(tokens);
  return [
    fontFaceCss(design.fontSources),
    lightTokensCss(design),
    PAGE_BASE,
    extraCss,
    globalCss,
    PLACEHOLDER_CSS,
  ].join('\n');
}

/** The stylesheets the canvas loads: the website's own face and the design system's Google fonts. */
export function canvasStylesheets(tokens: unknown): string[] {
  const google = googleSourcesUrl(readTokens(tokens).fontSources);
  return google ? [WEBSITE_FONT_STYLESHEET, google] : [WEBSITE_FONT_STYLESHEET];
}
