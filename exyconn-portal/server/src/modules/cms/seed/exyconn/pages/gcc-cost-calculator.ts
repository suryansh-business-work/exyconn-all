import type { CmsSeedPage } from '../../types';
import { place } from './place';
import {
  GCC_ACCENT,
  GCC_CALCULATOR_PATH,
  GCC_FAMILY,
  GCC_GUIDE_PATH,
  gccChapter,
} from './gcc-shared';

/**
 * exyconn.com/gcc-in-india/cost-calculator: the band, the calculator (its preset is the
 * 'gcc.calculator' catalogue default) and how the estimate is made and kept private.
 */
export const GCC_COST_CALCULATOR_PAGE: CmsSeedPage = {
  key: 'gcc-cost-calculator',
  path: GCC_CALCULATOR_PATH,
  kind: 'PAGE',
  title: 'GCC Cost Calculator for India | Exyconn',
  layout: 'default',
  seo: {
    title: 'GCC Cost Calculator for India | Exyconn',
    description:
      'Estimate the one-time, recurring and deposit costs of a Global Capability Centre in India across Lean, Standard and Enterprise scenarios. Runs in your browser.',
    keywords:
      'GCC cost calculator, global capability centre cost, India GCC budget, GCC setup cost estimate, offshore centre calculator',
    ogImageUrl:
      'https://images.unsplash.com/photo-1554224154-26032ffc0d07?fm=jpg&fit=crop&w=1200&h=630&q=80',
    canonical: '',
    noindex: false,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: '{siteUrl}/' },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'GCC in India cost guide',
          item: `{siteUrl}${GCC_GUIDE_PATH}`,
        },
        { '@type': 'ListItem', position: 3, name: 'GCC cost calculator' },
      ],
    },
  },
  html: [
    place('company.stage', {
      family: GCC_FAMILY,
      variant: 'band',
      crumbs: [
        { label: 'Home', href: '/' },
        { label: 'GCC in India cost guide', href: GCC_GUIDE_PATH },
        { label: 'GCC cost calculator', href: '' },
      ],
      title: 'GCC cost calculator',
      lede: 'Model the setup and running cost of your India centre — people, office, technology, compliance and services — across Lean, Standard and Enterprise scenarios, in your currency.',
      primary: { label: 'Read the cost guide', href: GCC_GUIDE_PATH, external: false },
      secondary: { label: 'Talk to Exyconn', href: '/contact', external: false },
      scene: { shapes: ['cubes'], data: { cubes: { cubes: 6 } }, accent: GCC_ACCENT },
      globeFromMarkets: false,
    }),
    place('gcc.calculator'),
    gccChapter(
      {
        index: 1,
        id: 'method',
        label: 'Method and privacy',
        title: 'How the estimate works, and where it is kept',
        lede: '',
      },
      [
        place('company.statement', {
          paragraphs: [
            'Every amount is computed in Indian rupees, month by month, and converted at the exchange rates you enter or fetch — the calculator never invents a rate. Defaults are illustrative assumptions; statutory parameters and AI list prices cite their sources. Replace the rest with your own quotes and payroll data, and confirm legal, tax and statutory items with qualified professionals.',
            'Your estimate is saved only in this browser (local storage). Nothing is sent to Exyconn unless you choose to email it, share it or request a consultation.',
          ],
          points: [],
        }),
      ],
    ),
    place('company.cta', {
      family: GCC_FAMILY,
      title: 'Want a second pair of eyes on your estimate?',
      text: 'Exyconn can review your assumptions, compare establishment models and plan the launch with you.',
      primary: { label: 'Talk to Exyconn', href: '/contact', external: false },
      secondary: { label: 'Read the cost guide', href: GCC_GUIDE_PATH, external: false },
    }),
  ].join(''),
  css: '',
};
