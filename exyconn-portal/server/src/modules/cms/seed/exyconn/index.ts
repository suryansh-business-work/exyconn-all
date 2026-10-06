import { componentPlaceholder } from '@exyconn/cms';
import type { CmsSiteSeed } from '../types';
import { EXYCONN_DESIGN_SYSTEM } from './design-system';
import { EXYCONN_PAGES } from './pages';

/**
 * exyconn.com as the CMS's first site: every page the site had before the CMS, migrated
 * section by section (pages/*), worn with today's header, footer and design tokens — so the
 * site looks exactly as it did, and every word of it is now editable in Website › Pages.
 */
export const EXYCONN_SEED: CmsSiteSeed = {
  site: {
    name: 'Exyconn',
    slug: 'exyconn',
    domains: ['exyconn.com', 'www.exyconn.com'],
    markets: true,
    defaultLocale: 'en',
    faviconUrl: '',
    seo: { titleTemplate: '%s', description: '', ogImageUrl: '' },
    headHtml: '',
    bodyEndHtml: '',
    globalCss: '',
    headerFragment: 'header',
    footerFragment: 'footer',
  },
  designSystem: EXYCONN_DESIGN_SYSTEM,
  fragments: [
    {
      key: 'header',
      name: 'Site header',
      kind: 'HEADER',
      html: componentPlaceholder('chrome.header', {}),
      css: '',
    },
    {
      key: 'footer',
      name: 'Site footer',
      kind: 'FOOTER',
      html: componentPlaceholder('chrome.footer', {}),
      css: '',
    },
  ],
  pages: EXYCONN_PAGES,
};
