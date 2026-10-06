import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/**
 * exyconn.com/ai-services/ai-observability (formerly the [slug].astro template
 * of exyconn-website/src/pages/[market]/ai-services over lib/services/aiServices.ts).
 */
export const AI_SERVICES_AI_OBSERVABILITY_PAGE: CmsSeedPage = {
  key: 'ai-services-ai-observability',
  path: '/ai-services/ai-observability',
  kind: 'PAGE',
  title: 'AI Observability | AI Services | Exyconn',
  layout: 'default',
  seo: {
    title: 'AI Observability | AI Services | Exyconn',
    description: 'See what your AI actually did, what it cost and where quality is slipping.',
    keywords: 'AI Observability, Platform & Infrastructure, AI services, Exyconn',
    ogImageUrl: '',
    canonical: 'https://exyconn.com/ai-services/ai-observability',
    noindex: false,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'AI Observability',
        description:
          'Tracing, evaluation and cost attribution for AI systems. Conventional monitoring says a request succeeded; it cannot say the answer was wrong. This is the tooling that catches quality regressions before customers report them.',
        url: 'https://exyconn.com/ai-services/ai-observability',
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
          name: 'AI Observability deliverables',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Full traces of prompts, retrievals and tool calls',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Automated evaluation against a regression set',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Cost attributed by feature, tenant and model',
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: 'Alerts on quality drift, not just errors',
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
            name: 'AI Observability',
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
          label: 'AI Observability',
          href: '',
        },
      ],
      title: 'AI Observability',
      lede: 'See what your AI actually did, what it cost and where quality is slipping.',
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
        'Tracing, evaluation and cost attribution for AI systems. Conventional monitoring says a request succeeded; it cannot say the answer was wrong. This is the tooling that catches quality regressions before customers report them.',
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
        'Full traces of prompts, retrievals and tool calls',
        'Automated evaluation against a regression set',
        'Cost attributed by feature, tenant and model',
        'Alerts on quality drift, not just errors',
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
