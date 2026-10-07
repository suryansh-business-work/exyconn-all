import type { CmsSeedPage, CmsSiteSeed } from '../../../../src/modules/cms/seed/types';

/**
 * A small seed that stands in for exyconn.com's (see cms.seed*.test.ts, which mock the real
 * seed with it): the logic under test is how a seed is applied, not what exyconn.com holds.
 */
const page = (key: string, path: string, html: string): CmsSeedPage => ({
  key,
  path,
  kind: 'PAGE',
  title: key,
  layout: 'default',
  seo: {
    title: '',
    description: '',
    keywords: '',
    ogImageUrl: '',
    canonical: '',
    noindex: false,
    jsonLd: null,
  },
  html,
  css: '',
});

export const EXYCONN_SEED: CmsSiteSeed = {
  site: {
    name: 'Seeded',
    slug: 'seeded',
    domains: ['seeded.test'],
    markets: false,
    defaultLocale: 'en',
    faviconUrl: '',
    seo: { titleTemplate: '%s', description: '', ogImageUrl: '' },
    headHtml: '<meta name="x">',
    bodyEndHtml: '',
    globalCss: '',
    headerFragment: 'header',
    footerFragment: 'footer',
  },
  designSystem: { name: 'Seed design', tokens: {}, extraCss: '' },
  fragments: [
    {
      key: 'header',
      name: 'Header',
      kind: 'HEADER',
      html: '<exy-component data-key="chrome.header"></exy-component>',
      css: '',
    },
    { key: 'footer', name: 'Footer', kind: 'FOOTER', html: '<footer></footer>', css: 'f{}' },
  ],
  pages: [
    page('home', '/', '<exy-fragment data-fragment-id="seed:header"></exy-fragment><p>Hi</p>'),
    // A seed key no fragment carries, in an attribute the compiler does not read.
    page('about', '/about', '<p data-fragment-id="seed:ghost">About</p>'),
  ],
};
