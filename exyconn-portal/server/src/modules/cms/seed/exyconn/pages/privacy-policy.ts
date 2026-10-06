import type { CmsSeedPage } from '../../types';
import { place } from './place';

/**
 * exyconn.com/privacy-policy (formerly src/pages/[market]/privacy-policy.astro): the legal document.
 */
export const PRIVACY_POLICY_PAGE: CmsSeedPage = {
  key: 'privacy-policy',
  path: '/privacy-policy',
  kind: 'PAGE',
  title: 'Privacy Policy | Data Protection | Exyconn',
  layout: 'default',
  seo: {
    title: 'Privacy Policy | Data Protection | Exyconn',
    description:
      "Read Exyconn's privacy policy to learn how we collect, use, and protect your personal information when you use our website and AI automation services.",
    keywords: 'privacy policy, data protection, personal information, cookies, Exyconn',
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
          name: 'Legal',
          item: '{siteUrl}/legal',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Privacy policy',
        },
      ],
    },
  },
  html: [place('legal.document')].join(''),
  css: '',
};
