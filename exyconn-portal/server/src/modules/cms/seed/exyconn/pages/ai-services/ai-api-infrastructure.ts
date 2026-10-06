import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/**
 * exyconn.com/ai-services/ai-api-infrastructure (formerly the [slug].astro template
 * of exyconn-website/src/pages/[market]/ai-services over lib/services/aiServices.ts).
 */
export const AI_SERVICES_AI_API_INFRASTRUCTURE_PAGE: CmsSeedPage = {
  key: 'ai-services-ai-api-infrastructure',
  path: '/ai-services/ai-api-infrastructure',
  kind: 'PAGE',
  title: 'AI API / Infrastructure | AI Services | Exyconn',
  layout: 'default',
  seo: {
    title: 'AI API / Infrastructure | AI Services | Exyconn',
    description: 'The serving layer behind your AI features — routing, caching and cost control.',
    keywords: 'AI API / Infrastructure, Platform & Infrastructure, AI services, Exyconn',
    ogImageUrl: '',
    canonical: 'https://exyconn.com/ai-services/ai-api-infrastructure',
    noindex: false,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'AI API / Infrastructure',
        description:
          'Gateways, model routing, caching, rate limiting and failover, so AI features stay fast and affordable under real traffic. Model choice becomes a configuration decision rather than a rewrite.',
        url: 'https://exyconn.com/ai-services/ai-api-infrastructure',
        serviceType: 'Platform & Infrastructure',
        category: 'Platform & Infrastructure',
        areaServed: 'Worldwide',
        provider: {
          '@type': 'Organization',
          name: 'Exyconn',
          url: 'https://exyconn.com',
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'AI API / Infrastructure deliverables',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'A gateway with routing and automatic failover',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Caching and batching to cut inference spend',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Per-tenant rate limits and quotas',
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: 'Model swaps without touching product code',
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
            name: 'Platform & Infrastructure',
            item: 'https://exyconn.com/ai-services?cat=platform-infrastructure',
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: 'AI API / Infrastructure',
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
          label: 'Platform & Infrastructure',
          href: '/ai-services?cat=platform-infrastructure',
        },
        {
          label: 'AI API / Infrastructure',
          href: '',
        },
      ],
      title: 'AI API / Infrastructure',
      lede: 'The serving layer behind your AI features — routing, caching and cost control.',
      primary: {
        label: 'Get a quote',
        href: '/get-a-quote',
      },
      secondary: {
        label: 'Talk to us',
        href: '/contact',
      },
      scene: {
        shapes: ['aiChip'],
        data: {
          aiChip: {
            pads: 6,
          },
        },
      },
      glyph: '',
      tagline: '',
    }),
    place('aiservice.approach', {
      index: 1,
      label: 'Approach',
      title: 'How we approach it',
      description:
        'Gateways, model routing, caching, rate limiting and failover, so AI features stay fast and affordable under real traffic. Model choice becomes a configuration decision rather than a rewrite.',
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
        title: 'Platform & Infrastructure',
        description:
          'The layer your AI features are built on: retrieval, data, APIs and observability.',
        href: '/ai-services?cat=platform-infrastructure',
        link: 'See the whole category',
      },
    }),
    place('aiservice.outcomes', {
      index: 2,
      label: 'Deliverables',
      title: 'What you get',
      outcomes: [
        'A gateway with routing and automatic failover',
        'Caching and batching to cut inference spend',
        'Per-tenant rate limits and quotas',
        'Model swaps without touching product code',
      ],
    }),
    place('aiservice.related', {
      index: 3,
      label: 'Related',
      title: 'More in Platform & Infrastructure',
      more: 'Explore service',
      services: [
        {
          href: '/ai-services/ai-rag-platform',
          title: 'AI RAG Platform',
          text: 'Retrieval that grounds answers in your own content, with citations.',
        },
        {
          href: '/ai-services/ai-knowledge-management',
          title: 'AI Knowledge Management',
          text: 'Scattered institutional knowledge made searchable and kept current.',
        },
        {
          href: '/ai-services/ai-data-analytics',
          title: 'AI Data & Analytics',
          text: 'Pipelines and analysis that make your data usable for AI in the first place.',
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
