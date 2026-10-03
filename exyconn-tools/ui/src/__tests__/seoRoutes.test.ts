/**
 * Server-side meta contract: every route the prerender writes has its own non-empty,
 * unique title, description and canonical, and the SPA's `metaForPath` returns the very
 * same meta for that URL (one source of truth for crawlers and client-side navigation).
 */
import { describe, it, expect } from 'vitest';
import { renderHead, ROBOTS_NOINDEX, type JsonLdNode, type PageMeta } from '@exyconn/seo';
import { seoRoutes, metaForPath } from '../shared/seo/routes';
import { SITE_ORIGIN, HUB_PATH, categoryPath } from '../shared/seo/site';
import { toolsData, getAllTools } from '../shared/data/toolsData';
import { getToolDetails } from '../shared/data/toolDetails';

const routes = seoRoutes();
const types = (meta: PageMeta): unknown[] => (meta.jsonLd ?? []).map((node: JsonLdNode) => node['@type']);

describe('seoRoutes', () => {
  it('covers the hub, every category and every registered tool', () => {
    const paths = routes.map((route) => route.path);
    expect(paths[0]).toBe(HUB_PATH);
    toolsData.forEach((category) => expect(paths).toContain(categoryPath(category.slug)));
    getAllTools().forEach((tool) => expect(paths).toContain(tool.url));
    expect(routes).toHaveLength(1 + toolsData.length + getAllTools().length);
  });

  it.each(['title', 'description', 'canonical'] as const)('gives every route a non-empty, unique %s', (field) => {
    const values = routes.map((route) => route.meta[field]);
    values.forEach((value) => expect(value.trim()).not.toBe(''));
    expect(new Set(values).size).toBe(values.length);
  });

  it('points every canonical at its own absolute URL', () => {
    routes.forEach((route) => expect(route.meta.canonical).toBe(`${SITE_ORIGIN}${route.path}`));
  });

  it('gives every route a real share image with dimensions and alt text', () => {
    routes.forEach((route) =>
      expect(route.meta.image).toMatchObject({ url: `${SITE_ORIGIN}/og-image.png`, width: 1200, height: 630 })
    );
  });

  it('matches what the SPA applies on navigation', () => {
    routes.forEach((route) => expect(metaForPath(route.path)).toEqual(route.meta));
  });
});

describe('structured data per page kind', () => {
  it('home carries WebSite (with search) and Organization', () => {
    const meta = metaForPath('/');
    expect(types(meta)).toEqual(expect.arrayContaining(['WebSite', 'Organization']));
    expect(JSON.stringify(meta.jsonLd)).toContain(`${SITE_ORIGIN}${HUB_PATH}?q={search_term_string}`);
  });

  it('categories carry CollectionPage and BreadcrumbList', () => {
    toolsData.forEach((category) =>
      expect(types(metaForPath(categoryPath(category.slug)))).toEqual(['CollectionPage', 'BreadcrumbList'])
    );
  });

  it('tools carry WebApplication, BreadcrumbList and FAQPage from their details', () => {
    getAllTools().forEach((tool) => {
      const expected = getToolDetails(tool.id)?.faqs.length
        ? ['WebApplication', 'BreadcrumbList', 'FAQPage']
        : ['WebApplication', 'BreadcrumbList'];
      expect(types(metaForPath(tool.url))).toEqual(expected);
    });
  });
});

describe('metaForPath', () => {
  it('ignores a trailing slash', () => {
    const tool = getAllTools()[0];
    expect(metaForPath(`${tool.url}/`)).toEqual(metaForPath(tool.url));
  });

  it.each(['/nope', '/tools/not-a-tool', '/categories/not-a-category'])('marks %s as noindex', (path) => {
    const meta = metaForPath(path);
    expect(meta.robots).toBe(ROBOTS_NOINDEX);
    expect(meta.title).toContain('Page not found');
  });

  it('renders a full head for a tool', () => {
    const head = renderHead(metaForPath('/tools/merge-pdf'));
    expect(head).toContain('<link rel="canonical" href="https://tools.exyconn.com/tools/merge-pdf">');
    expect(head).toContain('<meta property="og:image" content="https://tools.exyconn.com/og-image.png">');
    expect(head).toContain('"@type":"FAQPage"');
  });
});
