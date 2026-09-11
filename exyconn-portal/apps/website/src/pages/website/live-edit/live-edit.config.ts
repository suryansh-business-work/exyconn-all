import { env } from '@exyconn/shell/config/env';

/** A URL on the public website. */
export const siteUrl = (path: string): string => new URL(path, env.brandUrl).href;

/**
 * The class the website's detail pages wrap an article body in. The live editor puts
 * it on its canvas body, so the site's article rules apply there exactly as on the page.
 */
export const ARTICLE_CLASS = 'article-body';

/** The website's standalone article stylesheet (fonts, reset and `.article-body` rules). */
export const ARTICLE_CANVAS_STYLES = [siteUrl('/styles/article-canvas.css')];

/** ImageKit folders the website's media is uploaded into. */
export const MEDIA_FOLDERS = {
  blog: 'website/blog',
  caseStudies: 'website/case-studies',
  careers: 'website/careers',
  tools: 'website/tools',
} as const;
