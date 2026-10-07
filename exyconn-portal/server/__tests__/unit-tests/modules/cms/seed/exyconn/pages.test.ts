import { cmsComponent, compileHtml, type CmsBlock } from '@exyconn/cms';
import { EXYCONN_PAGES } from '../../../../../../src/modules/cms/seed/exyconn/pages';
import { AI_PAGES } from '../../../../../../src/modules/cms/seed/exyconn/pages/ai';
import { AI_SERVICE_PAGES } from '../../../../../../src/modules/cms/seed/exyconn/pages/ai-services';
import { SERVICE_PAGES } from '../../../../../../src/modules/cms/seed/exyconn/pages/services';
import type { CmsSeedPage } from '../../../../../../src/modules/cms/seed/types';

const SITE = 'https://exyconn.com';

/** Every component key in a block tree whose catalogue entry is missing or misused. */
function componentProblems(blocks: readonly CmsBlock[]): string[] {
  return blocks.flatMap((block) => {
    if (block.kind !== 'component') {
      return [];
    }
    const definition = cmsComponent(block.key);
    if (!definition) {
      return [`unknown ${block.key}`];
    }
    const own = block.children.length > 0 && !definition.acceptsChildren;
    return [
      ...(own ? [`${block.key} cannot hold children`] : []),
      ...componentProblems(block.children),
    ];
  });
}

const jsonLdItems = (page: CmsSeedPage): unknown[] => {
  const { jsonLd } = page.seo;
  if (jsonLd === null) {
    return [];
  }
  return Array.isArray(jsonLd) ? jsonLd : [jsonLd];
};

describe('EXYCONN_PAGES', () => {
  it('starts with the home page and gives every page a unique key and path', () => {
    const keys = EXYCONN_PAGES.map((page) => page.key);
    const paths = EXYCONN_PAGES.map((page) => page.path);

    expect(EXYCONN_PAGES[0].path).toBe('/');
    expect(new Set(keys).size).toBe(EXYCONN_PAGES.length);
    expect(new Set(paths).size).toBe(EXYCONN_PAGES.length);
  });

  it('includes every area list in full', () => {
    for (const area of [SERVICE_PAGES, AI_PAGES, AI_SERVICE_PAGES]) {
      expect(EXYCONN_PAGES).toEqual(expect.arrayContaining(area));
    }
    expect([SERVICE_PAGES.length, AI_PAGES.length, AI_SERVICE_PAGES.length]).toEqual([12, 8, 30]);
  });

  it('keeps each area under its own path', () => {
    expect(SERVICE_PAGES.every((page) => page.path.startsWith('/services'))).toBe(true);
    expect(AI_PAGES.every((page) => page.path === '/ai' || page.path.startsWith('/ai/'))).toBe(
      true,
    );
    expect(AI_SERVICE_PAGES.every((page) => page.path.startsWith('/ai-services'))).toBe(true);
  });

  it('marks exactly the pages with route parameters as templates', () => {
    const templates = EXYCONN_PAGES.filter((page) => page.kind === 'TEMPLATE');
    const parameterised = EXYCONN_PAGES.filter((page) => page.path.includes('/:'));

    expect(templates).toEqual(parameterised);
    expect(templates.map((page) => page.path)).toEqual(
      expect.arrayContaining(['/blog/:slug', '/case-studies/:slug', '/policies/:slug']),
    );
  });

  it.each(EXYCONN_PAGES.map((page) => [page.key, page] as const))(
    '%s is a titled, indexable default-layout page under the site root',
    (_key, page) => {
      expect(page.path.startsWith('/')).toBe(true);
      expect(page.layout).toBe('default');
      expect(page.title).not.toBe('');
      expect(page.seo.title).not.toBe('');
      expect(page.seo.description).not.toBe('');
      expect(page.seo.noindex).toBe(false);
      expect(page.css).toBe('');
    },
  );

  it.each(EXYCONN_PAGES.map((page) => [page.key, page] as const))(
    '%s compiles to catalogue components only',
    (_key, page) => {
      const { blocks } = compileHtml(page.html, page.css);

      expect(blocks.some((block) => block.kind === 'component')).toBe(true);
      expect(blocks.some((block) => block.kind === 'fragment')).toBe(false);
      expect(componentProblems(blocks)).toEqual([]);
    },
  );

  it('gives a canonical URL only as the page path on exyconn.com', () => {
    const canonical = EXYCONN_PAGES.filter((page) => page.seo.canonical !== '');

    expect(canonical.length).toBeGreaterThan(0);
    for (const page of canonical) {
      expect(page.seo.canonical).toBe(`${SITE}${page.path}`);
    }
  });

  it('writes structured data as schema.org items with a type', () => {
    const items = EXYCONN_PAGES.flatMap(jsonLdItems);

    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item).toMatchObject({ '@context': 'https://schema.org', '@type': expect.any(String) });
    }
  });

  it('leaves structured data off the collection pages, which the website derives from items', () => {
    const collections = EXYCONN_PAGES.filter((page) =>
      ['/blog', '/case-studies', '/career', '/our-tools', '/policies', '/newsletter'].some(
        (prefix) => page.path.startsWith(prefix),
      ),
    );

    expect(collections).toHaveLength(15);
    expect(collections.every((page) => page.seo.jsonLd === null)).toBe(true);
  });
});
