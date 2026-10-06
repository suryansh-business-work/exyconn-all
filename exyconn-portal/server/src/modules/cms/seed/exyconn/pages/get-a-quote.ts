import type { CmsSeedPage } from '../../types';
import { place } from './place';

/**
 * exyconn.com/get-a-quote (formerly src/pages/[market]/get-a-quote.astro): the band and the
 * budget calculator.
 */
export const GET_A_QUOTE_PAGE: CmsSeedPage = {
  key: 'get-a-quote',
  path: '/get-a-quote',
  kind: 'PAGE',
  title: 'Get a Quote | Project Budget Calculator | Exyconn',
  layout: 'default',
  seo: {
    title: 'Get a Quote | Project Budget Calculator | Exyconn',
    description:
      "Use Exyconn's Software Budget Calculator to estimate your project costs. Select project type, team composition, and timeline for an instant budget estimate.",
    keywords:
      'get a quote, software budget calculator, project estimate, AI development, SaaS pricing, Exyconn',
    ogImageUrl:
      'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&w=1200&q=80',
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
          name: 'Get a quote',
        },
      ],
    },
  },
  html: [
    place('company.stage', {
      family: 'contact',
      variant: 'band',
      crumbs: [
        {
          label: 'Home',
          href: '/',
        },
        {
          label: 'Get a quote',
          href: '',
        },
      ],
      title: 'Estimate your project in minutes',
      lede: 'Get an instant estimate for your software project. Configure your team, timeline, and requirements.',
      primary: {
        label: '',
        href: '',
        external: false,
      },
      secondary: {
        label: '',
        href: '',
        external: false,
      },
      scene: {
        shapes: ['rings'],
        data: {
          rings: {
            rings: 4,
          },
        },
      },
      globeFromMarkets: false,
    }),
    place('company.quote'),
  ].join(''),
  css: '',
};
