import type { CmsSeedPage } from '../../types';
import { GCC_GUIDE_PATH } from './gcc-shared';
import {
  GCC_GUIDE_CITIES,
  GCC_GUIDE_DRIVERS,
  GCC_GUIDE_HERO,
  GCC_GUIDE_MODELS,
  GCC_GUIDE_PEOPLE,
} from './gcc-cost-guide.sections';
import {
  GCC_GUIDE_COST_TYPES,
  GCC_GUIDE_CTA,
  GCC_GUIDE_FAQ,
  GCC_GUIDE_LEGAL,
  GCC_GUIDE_PLANNING,
  GCC_GUIDE_TECHNOLOGY,
} from './gcc-cost-guide.sections-more';

/**
 * exyconn.com/gcc-in-india/cost-guide: the guide for companies planning a Global Capability
 * Centre in India — hero, then nine chapters (drivers, models, cities, people, technology,
 * compliance, cost types, three-year planning, FAQs and method) and the consultation call.
 * Market figures appear only with a cited source; every other amount is called illustrative.
 */
export const GCC_COST_GUIDE_PAGE: CmsSeedPage = {
  key: 'gcc-cost-guide',
  path: GCC_GUIDE_PATH,
  kind: 'PAGE',
  title: 'GCC in India Cost Guide | Exyconn',
  layout: 'default',
  seo: {
    title: 'GCC in India Cost Guide: Setup and Running Costs | Exyconn',
    description:
      'Plan a Global Capability Centre in India: establishment models, cities, people, AI and technology, compliance and three-year costs, with a free calculator.',
    keywords:
      'GCC in India, global capability centre, GCC setup cost, captive centre India, build operate transfer, managed GCC, India offshore centre cost',
    ogImageUrl: '',
    canonical: '',
    noindex: false,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: '{siteUrl}/' },
        { '@type': 'ListItem', position: 2, name: 'GCC in India cost guide' },
      ],
    },
  },
  html: [
    GCC_GUIDE_HERO,
    GCC_GUIDE_DRIVERS,
    GCC_GUIDE_MODELS,
    GCC_GUIDE_CITIES,
    GCC_GUIDE_PEOPLE,
    GCC_GUIDE_TECHNOLOGY,
    GCC_GUIDE_LEGAL,
    GCC_GUIDE_COST_TYPES,
    GCC_GUIDE_PLANNING,
    GCC_GUIDE_FAQ,
    GCC_GUIDE_CTA,
  ].join(''),
  css: '',
};
