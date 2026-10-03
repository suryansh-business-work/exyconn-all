/**
 * Post-build prerenderer: writes `dist/<route>/index.html` for every indexable route — the
 * hub, each category and each tool — with that route's full head (title, description,
 * keywords, canonical, robots, Open Graph, Twitter, JSON-LD) rendered by @exyconn/seo from
 * the same builders the SPA applies on client-side navigation (src/shared/seo/routes.ts).
 *
 * nginx serves these via `try_files $uri $uri/ /index.html`, so crawlers and link previews
 * get per-route meta without JavaScript, while the SPA boots as usual.
 *
 * Run with: tsx scripts/prerender.ts   (wired into `npm run build`)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditMeta, renderHead } from '@exyconn/seo';
import { seoRoutes } from '../src/shared/seo/routes';
import { hubMeta } from '../src/shared/seo/pages';
import { SITE_ORIGIN } from '../src/shared/seo/site';

const DIST = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
const SEO_BLOCK = /<!-- seo:start[\s\S]*?<!-- seo:end -->/;
const INDENT = '\n    ';

function withHead(template: string, head: string): string {
  if (!SEO_BLOCK.test(template)) {
    throw new Error('prerender: dist/index.html has no <!-- seo:start --> … <!-- seo:end --> block');
  }
  return template.replace(SEO_BLOCK, () => head.split('\n').join(INDENT));
}

function writePage(path: string, html: string): void {
  const dir = join(DIST, path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
}

function writeCrawlerFiles(paths: readonly string[]): void {
  const urls = paths.map((path) => `  <url><loc>${SITE_ORIGIN}${path}</loc></url>`).join('\n');
  writeFileSync(
    join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  );
  writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`);
}

function main(): void {
  const template = readFileSync(join(DIST, 'index.html'), 'utf8');
  const routes = seoRoutes();
  const warnings: string[] = [];

  for (const route of routes) {
    writePage(route.path, withHead(template, renderHead(route.meta)));
    warnings.push(...auditMeta(route.meta).map((warning) => `${route.path}: ${warning.message}`));
  }
  // `/` and every unknown URL nginx falls back to serve the hub.
  writeFileSync(join(DIST, 'index.html'), withHead(template, renderHead(hubMeta())));
  writeCrawlerFiles(routes.map((route) => route.path));

  console.log(`prerender: wrote ${routes.length} routes + / + sitemap.xml + robots.txt`);
  if (warnings.length) {
    console.warn(`prerender: ${warnings.length} SEO guidance warnings (not applied):\n  ${warnings.join('\n  ')}`);
  }
}

main();
