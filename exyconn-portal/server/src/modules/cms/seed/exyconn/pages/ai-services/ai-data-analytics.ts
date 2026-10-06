import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/**
 * exyconn.com/ai-services/ai-data-analytics (formerly the [slug].astro template
 * of exyconn-website/src/pages/[market]/ai-services over lib/services/aiServices.ts).
 */
export const AI_SERVICES_AI_DATA_ANALYTICS_PAGE: CmsSeedPage = {
  key: 'ai-services-ai-data-analytics',
  path: '/ai-services/ai-data-analytics',
  kind: 'PAGE',
  title: 'AI Data & Analytics | AI Services | Exyconn',
  layout: 'default',
  seo: {
    title: 'AI Data & Analytics | AI Services | Exyconn',
    description: 'Pipelines and analysis that make your data usable for AI in the first place.',
    keywords: 'AI Data & Analytics, Platform & Infrastructure, AI services, Exyconn',
    ogImageUrl: '',
    canonical: 'https://exyconn.com/ai-services/ai-data-analytics',
    noindex: false,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'AI Data & Analytics',
        description:
          'AI features are only as good as the data behind them. We build the pipelines, modelling and quality checks that make data trustworthy, then the analysis layer that lets people ask questions of it directly.',
        url: 'https://exyconn.com/ai-services/ai-data-analytics',
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
          name: 'AI Data & Analytics deliverables',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Pipelines with quality checks and monitoring',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'A modelled layer analysts and AI can both use',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Natural-language querying over governed data',
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: 'Metrics defined once, consistent everywhere',
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
            name: 'AI Data & Analytics',
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
          label: 'AI Data & Analytics',
          href: '',
        },
      ],
      title: 'AI Data & Analytics',
      lede: 'Pipelines and analysis that make your data usable for AI in the first place.',
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
        'AI features are only as good as the data behind them. We build the pipelines, modelling and quality checks that make data trustworthy, then the analysis layer that lets people ask questions of it directly.',
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
        'Pipelines with quality checks and monitoring',
        'A modelled layer analysts and AI can both use',
        'Natural-language querying over governed data',
        'Metrics defined once, consistent everywhere',
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
          href: '/ai-services/ai-api-infrastructure',
          title: 'AI API / Infrastructure',
          text: 'The serving layer behind your AI features — routing, caching and cost control.',
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
