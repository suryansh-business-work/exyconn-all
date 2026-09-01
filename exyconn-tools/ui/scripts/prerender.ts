/**
 * Post-build prerenderer: writes a static `dist/tools/<id>/index.html` for
 * every registered tool with its full SEO head (title, description, keywords,
 * canonical, Open Graph, Twitter, JSON-LD) baked into the HTML source.
 *
 * nginx serves these via `try_files $uri $uri/ /index.html`, so crawlers get
 * per-tool meta without JavaScript, while the SPA hydrates and runs as usual.
 *
 * Run with: tsx scripts/prerender.ts   (wired into `npm run build`)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toolsData, getAllTools, getCategoryOfTool } from '../src/shared/data/toolsData';
import { getToolDetails } from '../src/shared/data/toolDetails';
import { buildToolMeta, SITE_ORIGIN, SITE_NAME, DEFAULT_DESCRIPTION, type BuiltMeta } from '../src/shared/seo/buildMeta';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, '../dist');

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function headBlock(meta: BuiltMeta): string {
  const lines: string[] = [
    `<meta name="keywords" content="${escapeHtml(meta.keywords)}" />`,
    `<link rel="canonical" href="${meta.canonical}" />`,
    ...Object.entries(meta.ogTags).map(
      ([key, value]) => `<meta property="${key}" content="${escapeHtml(value)}" />`,
    ),
    ...Object.entries(meta.twitterTags).map(
      ([key, value]) => `<meta name="${key}" content="${escapeHtml(value)}" />`,
    ),
    `<script type="application/ld+json">${JSON.stringify(meta.jsonLd)}</script>`,
  ];
  return `    ${lines.join('\n    ')}\n  `;
}

function renderPage(template: string, meta: BuiltMeta): string {
  return template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(meta.title)}</title>`)
    .replace(
      /(<meta\s+name="description"\s+content=")[^"]*(")/,
      `$1${escapeHtml(meta.description)}$2`,
    )
    .replace('</head>', `${headBlock(meta)}</head>`);
}

function main(): void {
  const template = readFileSync(join(DIST, 'index.html'), 'utf8');
  const tools = getAllTools();
  let written = 0;
  const skipped: string[] = [];

  for (const tool of tools) {
    const details = getToolDetails(tool.id);
    if (!details) {
      skipped.push(tool.id);
    }
    const meta = buildToolMeta({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      categoryName: getCategoryOfTool(tool.id)?.category ?? 'Tools',
      details,
    });
    const outDir = join(DIST, 'tools', tool.id);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'index.html'), renderPage(template, meta));
    written += 1;
  }

  // Landing page: bake richer default meta + an ItemList of every tool.
  const landingJsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `Free Online Tools | ${SITE_NAME}`,
      description: DEFAULT_DESCRIPTION,
      url: `${SITE_ORIGIN}/tools`,
      publisher: { '@type': 'Organization', name: 'Exyconn', url: 'https://exyconn.com' },
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: tools.length,
        itemListElement: tools.map((tool, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: tool.name,
          url: `${SITE_ORIGIN}${tool.url}`,
        })),
      },
    },
  ];
  const landingMeta: BuiltMeta = {
    title: `Free Online Tools — ${tools.length}+ SEO, PDF, Image & AI Tools | ${SITE_NAME}`,
    description: DEFAULT_DESCRIPTION,
    canonical: `${SITE_ORIGIN}/tools`,
    keywords: toolsData.map((category) => category.category).join(', '),
    ogTags: {
      'og:site_name': SITE_NAME,
      'og:type': 'website',
      'og:title': `Free Online Tools | ${SITE_NAME}`,
      'og:description': DEFAULT_DESCRIPTION,
      'og:url': `${SITE_ORIGIN}/tools`,
    },
    twitterTags: {
      'twitter:card': 'summary',
      'twitter:title': `Free Online Tools | ${SITE_NAME}`,
      'twitter:description': DEFAULT_DESCRIPTION,
    },
    jsonLd: landingJsonLd,
  };
  const landingHtml = renderPage(template, landingMeta);
  mkdirSync(join(DIST, 'tools'), { recursive: true });
  writeFileSync(join(DIST, 'tools', 'index.html'), landingHtml);
  writeFileSync(join(DIST, 'index.html'), landingHtml);

  // sitemap.xml + robots.txt
  const urls = [`${SITE_ORIGIN}/tools`, ...tools.map((tool) => `${SITE_ORIGIN}${tool.url}`)];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((url) => `  <url><loc>${url}</loc></url>`)
    .join('\n')}\n</urlset>\n`;
  writeFileSync(join(DIST, 'sitemap.xml'), sitemap);
  writeFileSync(
    join(DIST, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`,
  );

  console.log(`prerender: wrote ${written} tool pages + landing + sitemap (${urls.length} urls)`);
  if (skipped.length) {
    console.warn(`prerender: ${skipped.length} tools have no toolDetails content: ${skipped.join(', ')}`);
  }
}

main();
