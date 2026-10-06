import type { CmsSeedPage } from '../../types';
import { place } from './place';

/**
 * exyconn.com/sitemap (formerly src/pages/[market]/sitemap.astro): every page, grouped and
 * searchable, from Website › Navigation.
 */
export const SITEMAP_PAGE: CmsSeedPage = {
  key: 'sitemap',
  path: '/sitemap',
  kind: 'PAGE',
  title: 'Sitemap | Exyconn',
  layout: 'default',
  seo: {
    title: 'Sitemap | Exyconn',
    description:
      'Browse all pages and sections of Exyconn. Find services, products, careers, and more.',
    keywords: '',
    ogImageUrl: '',
    canonical: '',
    noindex: false,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: '{siteUrl}/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Sitemap',
        },
      ],
    },
  },
  html: [place('company.sitemap')].join(''),
  css: '',
};
