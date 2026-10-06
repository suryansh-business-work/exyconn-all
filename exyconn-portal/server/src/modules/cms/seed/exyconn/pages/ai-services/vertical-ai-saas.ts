import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/**
 * exyconn.com/ai-services/vertical-ai-saas (formerly the [slug].astro template
 * of exyconn-website/src/pages/[market]/ai-services over lib/services/aiServices.ts).
 */
export const AI_SERVICES_VERTICAL_AI_SAAS_PAGE: CmsSeedPage = {
  key: 'ai-services-vertical-ai-saas',
  path: '/ai-services/vertical-ai-saas',
  kind: 'PAGE',
  title: 'Vertical AI SaaS | AI Services | Exyconn',
  layout: 'default',
  seo: {
    title: 'Vertical AI SaaS | AI Services | Exyconn',
    description: 'A complete AI SaaS product built for one industry — from idea to launch.',
    keywords: 'Vertical AI SaaS, Industry Platforms, AI services, Exyconn',
    ogImageUrl: '',
    canonical: 'https://exyconn.com/ai-services/vertical-ai-saas',
    noindex: false,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Vertical AI SaaS',
        description:
          'We build and ship vertical AI products end to end: the domain model, the application, the AI layer and the commercial scaffolding around it. For founders and operators who know an industry deeply and need a product built the way that industry actually works.',
        url: 'https://exyconn.com/ai-services/vertical-ai-saas',
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
          name: 'Vertical AI SaaS deliverables',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Product and domain model defined with your expertise',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Multi-tenant application with billing and onboarding',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'AI features grounded in industry-specific data',
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: 'Launched, then iterated on real usage',
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
            name: 'Vertical AI SaaS',
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
          label: 'Vertical AI SaaS',
          href: '',
        },
      ],
      title: 'Vertical AI SaaS',
      lede: 'A complete AI SaaS product built for one industry — from idea to launch.',
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
        'We build and ship vertical AI products end to end: the domain model, the application, the AI layer and the commercial scaffolding around it. For founders and operators who know an industry deeply and need a product built the way that industry actually works.',
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
        'Product and domain model defined with your expertise',
        'Multi-tenant application with billing and onboarding',
        'AI features grounded in industry-specific data',
        'Launched, then iterated on real usage',
      ],
    }),
    place('aiservice.related', {
      index: 3,
      label: 'Related',
      title: 'More in Industry Platforms',
      more: 'Explore service',
      services: [
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
        {
          href: '/ai-services/ai-education-edtech',
          title: 'AI Education / EdTech',
          text: 'Adaptive learning, assessment and teaching tools for education providers.',
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
