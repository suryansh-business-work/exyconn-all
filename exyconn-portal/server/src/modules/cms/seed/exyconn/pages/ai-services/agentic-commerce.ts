import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/**
 * exyconn.com/ai-services/agentic-commerce (formerly the [slug].astro template
 * of exyconn-website/src/pages/[market]/ai-services over lib/services/aiServices.ts).
 */
export const AI_SERVICES_AGENTIC_COMMERCE_PAGE: CmsSeedPage = {
  key: 'ai-services-agentic-commerce',
  path: '/ai-services/agentic-commerce',
  kind: 'PAGE',
  title: 'Agentic Commerce | AI Services | Exyconn',
  layout: 'default',
  seo: {
    title: 'Agentic Commerce | AI Services | Exyconn',
    description:
      'Make your catalogue and checkout usable by AI agents that buy on a customer’s behalf.',
    keywords: 'Agentic Commerce, Revenue & Growth, AI services, Exyconn',
    ogImageUrl: '',
    canonical: 'https://exyconn.com/ai-services/agentic-commerce',
    noindex: false,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Agentic Commerce',
        description:
          'Buying is beginning to happen through assistants rather than storefronts. We prepare your catalogue, pricing and checkout to be readable and transactable by agents, with the authentication and spend controls that make automated purchasing safe on both sides.',
        url: 'https://exyconn.com/ai-services/agentic-commerce',
        serviceType: 'Revenue & Growth',
        category: 'Revenue & Growth',
        areaServed: 'Worldwide',
        provider: {
          '@type': 'Organization',
          name: 'Exyconn',
          url: 'https://exyconn.com',
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Agentic Commerce deliverables',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Machine-readable catalogue and pricing',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Agent-safe checkout with scoped authorisation',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Spend limits and verification on automated purchases',
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: 'Positioned for assistant-driven buying as it grows',
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
            name: 'Revenue & Growth',
            item: 'https://exyconn.com/ai-services?cat=revenue-growth',
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: 'Agentic Commerce',
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
          label: 'Revenue & Growth',
          href: '/ai-services?cat=revenue-growth',
        },
        {
          label: 'Agentic Commerce',
          href: '',
        },
      ],
      title: 'Agentic Commerce',
      lede: 'Make your catalogue and checkout usable by AI agents that buy on a customer’s behalf.',
      primary: {
        label: 'Get a quote',
        href: '/get-a-quote',
      },
      secondary: {
        label: 'Talk to us',
        href: '/contact',
      },
      scene: {
        shapes: ['dataflow'],
      },
      glyph: '',
      tagline: '',
    }),
    place('aiservice.approach', {
      index: 1,
      label: 'Approach',
      title: 'How we approach it',
      description:
        'Buying is beginning to happen through assistants rather than storefronts. We prepare your catalogue, pricing and checkout to be readable and transactable by agents, with the authentication and spend controls that make automated purchasing safe on both sides.',
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
        title: 'Revenue & Growth',
        description: 'AI on the commercial front line — pipeline, campaigns, support and checkout.',
        href: '/ai-services?cat=revenue-growth',
        link: 'See the whole category',
      },
    }),
    place('aiservice.outcomes', {
      index: 2,
      label: 'Deliverables',
      title: 'What you get',
      outcomes: [
        'Machine-readable catalogue and pricing',
        'Agent-safe checkout with scoped authorisation',
        'Spend limits and verification on automated purchases',
        'Positioned for assistant-driven buying as it grows',
      ],
    }),
    place('aiservice.related', {
      index: 3,
      label: 'Related',
      title: 'More in Revenue & Growth',
      more: 'Explore service',
      services: [
        {
          href: '/ai-services/ai-sales-automation',
          title: 'AI Sales Automation',
          text: 'Research, outreach and follow-up handled so reps spend their time in conversations.',
        },
        {
          href: '/ai-services/ai-customer-support',
          title: 'AI Customer Support',
          text: 'Deflect the repetitive tickets and hand the rest over with full context.',
        },
        {
          href: '/ai-services/ai-marketing-automation',
          title: 'AI Marketing Automation',
          text: 'Campaign production and personalisation at a volume a small team cannot reach manually.',
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
