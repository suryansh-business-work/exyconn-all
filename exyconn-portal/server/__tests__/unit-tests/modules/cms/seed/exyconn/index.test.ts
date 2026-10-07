import { compileHtml } from '@exyconn/cms';
import { EXYCONN_SEED } from '../../../../../../src/modules/cms/seed/exyconn';
import { EXYCONN_DESIGN_SYSTEM } from '../../../../../../src/modules/cms/seed/exyconn/design-system';
import {
  EXYCONN_EXTRA_CSS,
  EXYCONN_TOKENS,
} from '../../../../../../src/modules/cms/seed/exyconn/design-tokens';
import { EXYCONN_PAGES } from '../../../../../../src/modules/cms/seed/exyconn/pages';

describe('EXYCONN_SEED site', () => {
  it('is exyconn.com, on its bare and www domains, with markets in English', () => {
    expect(EXYCONN_SEED.site).toMatchObject({
      name: 'Exyconn',
      slug: 'exyconn',
      domains: ['exyconn.com', 'www.exyconn.com'],
      markets: true,
      defaultLocale: 'en',
    });
  });

  it('leaves the head, body end and global CSS for editors, and titles pages as written', () => {
    const { site } = EXYCONN_SEED;
    expect(site.seo).toEqual({ titleTemplate: '%s', description: '', ogImageUrl: '' });
    expect([site.headHtml, site.bodyEndHtml, site.globalCss, site.faviconUrl]).toEqual([
      '',
      '',
      '',
      '',
    ]);
  });

  it('wears header and footer fragments that the seed actually defines', () => {
    const keys = EXYCONN_SEED.fragments.map((fragment) => fragment.key);

    expect(keys).toContain(EXYCONN_SEED.site.headerFragment);
    expect(keys).toContain(EXYCONN_SEED.site.footerFragment);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('EXYCONN_SEED fragments', () => {
  it.each([
    ['header', 'HEADER', 'chrome.header'],
    ['footer', 'FOOTER', 'chrome.footer'],
  ])('the %s fragment is the %s placing the %s component', (key, kind, component) => {
    const fragment = EXYCONN_SEED.fragments.find((item) => item.key === key);

    expect(fragment).toMatchObject({ kind, css: '' });
    expect(compileHtml(fragment?.html ?? '', '').blocks).toEqual([
      { kind: 'component', key: component, props: {}, children: [] },
    ]);
  });
});

describe('EXYCONN_SEED design system and pages', () => {
  it('carries the website tokens and the high-contrast CSS', () => {
    expect(EXYCONN_SEED.designSystem).toBe(EXYCONN_DESIGN_SYSTEM);
    expect(EXYCONN_DESIGN_SYSTEM).toEqual({
      name: 'Exyconn design system',
      tokens: EXYCONN_TOKENS,
      extraCss: EXYCONN_EXTRA_CSS,
    });
  });

  it('seeds every migrated page', () => {
    expect(EXYCONN_SEED.pages).toBe(EXYCONN_PAGES);
    expect(EXYCONN_PAGES).toHaveLength(79);
  });
});
