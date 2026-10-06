import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/**
 * exyconn.com/ai-services/ai-logistics-supply-chain (formerly the [slug].astro template
 * of exyconn-website/src/pages/[market]/ai-services over lib/services/aiServices.ts).
 */
export const AI_SERVICES_AI_LOGISTICS_SUPPLY_CHAIN_PAGE: CmsSeedPage = {
  key: 'ai-services-ai-logistics-supply-chain',
  path: '/ai-services/ai-logistics-supply-chain',
  kind: 'PAGE',
  title: 'AI Logistics & Supply Chain | AI Services | Exyconn',
  layout: 'default',
  seo: {
    title: 'AI Logistics & Supply Chain | AI Services | Exyconn',
    description: 'Forecasting, routing and exception handling across your supply chain.',
    keywords: 'AI Logistics & Supply Chain, Industry Platforms, AI services, Exyconn',
    ogImageUrl: '',
    canonical: 'https://exyconn.com/ai-services/ai-logistics-supply-chain',
    noindex: false,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'AI Logistics & Supply Chain',
        description:
          'Demand forecasting, route and load optimisation, and automated handling of the exceptions that consume a logistics team’s day. Built to work with the mixed data quality real supply chains actually have.',
        url: 'https://exyconn.com/ai-services/ai-logistics-supply-chain',
        serviceType: 'Industry Platforms',
        category: 'Industry Platforms',
        areaServed: 'Worldwide',
        provider: {
          '@type': 'Organization',
          name: 'Exyconn',
          url: 'https://exyconn.com',
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'AI Logistics & Supply Chain deliverables',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Demand forecasts at SKU and location level',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Route and load planning optimised against real constraints',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Delays and exceptions flagged before they escalate',
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: 'Documentation and customs paperwork automated',
            },
          ],
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://exyconn.com/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'AI services',
            item: 'https://exyconn.com/ai-services',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Industry Platforms',
            item: 'https://exyconn.com/ai-services?cat=vertical-platforms',
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: 'AI Logistics & Supply Chain',
          },
        ],
      },
    ],
  },
  html: [
    place('detail.stage', {
      family: 'services',
      crumbs: [
        {
          label: 'Home',
          href: '/',
        },
        {
          label: 'AI services',
          href: '/ai-services',
        },
        {
          label: 'Industry Platforms',
          href: '/ai-services?cat=vertical-platforms',
        },
        {
          label: 'AI Logistics & Supply Chain',
          href: '',
        },
      ],
      title: 'AI Logistics & Supply Chain',
      lede: 'Forecasting, routing and exception handling across your supply chain.',
      primary: {
        label: 'Get a quote',
        href: '/get-a-quote',
      },
      secondary: {
        label: 'Talk to us',
        href: '/contact',
      },
      scene: {
        shapes: ['cloudStack'],
      },
      glyph: '',
      tagline: '',
    }),
    place('aiservice.approach', {
      index: 1,
      label: 'Approach',
      title: 'How we approach it',
      description:
        'Demand forecasting, route and load optimisation, and automated handling of the exceptions that consume a logistics team’s day. Built to work with the mixed data quality real supply chains actually have.',
      scopeTitle: 'Scope this for your business',
      scopeText:
        'Send us the workflow you want this applied to. You get a scope, a timeline and a price — not a discovery invoice.',
      primary: {
        label: 'Get a quote',
        href: '/get-a-quote',
      },
      secondary: {
        label: 'Talk to us',
        href: '/contact',
      },
      category: {
        title: 'Industry Platforms',
        description: 'Vertical AI software shaped around how one industry actually operates.',
        href: '/ai-services?cat=vertical-platforms',
        link: 'See the whole category',
      },
    }),
    place('aiservice.outcomes', {
      index: 2,
      label: 'Deliverables',
      title: 'What you get',
      outcomes: [
        'Demand forecasts at SKU and location level',
        'Route and load planning optimised against real constraints',
        'Delays and exceptions flagged before they escalate',
        'Documentation and customs paperwork automated',
      ],
    }),
    place('aiservice.related', {
      index: 3,
      label: 'Related',
      title: 'More in Industry Platforms',
      more: 'Explore service',
      services: [
        {
          href: '/ai-services/vertical-ai-saas',
          title: 'Vertical AI SaaS',
          text: 'A complete AI SaaS product built for one industry — from idea to launch.',
        },
        {
          href: '/ai-services/ai-healthcare-software',
          title: 'AI Healthcare Software',
          text: 'Clinical and administrative AI built to the handling rules healthcare requires.',
        },
        {
          href: '/ai-services/ai-real-estate-software',
          title: 'AI Real Estate Software',
          text: 'Listing, lead and document workflows automated for property businesses.',
        },
      ],
    }),
    place('detail.cta', {
      family: 'services',
      label: '',
      title: "Tell us the process, we'll scope the AI",
      text: 'Bring one workflow that costs your team too much time. We will come back with what an AI system can take over, what it should not, and what it costs to build.',
      primary: {
        label: 'Get a quote',
        href: '/get-a-quote',
      },
      secondary: {
        label: 'Talk to us',
        href: '/contact',
      },
      echoShape: 0,
    }),
  ].join(''),
  css: '',
};
