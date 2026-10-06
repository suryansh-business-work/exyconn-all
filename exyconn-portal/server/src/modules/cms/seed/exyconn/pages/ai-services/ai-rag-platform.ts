import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/**
 * exyconn.com/ai-services/ai-rag-platform (formerly the [slug].astro template
 * of exyconn-website/src/pages/[market]/ai-services over lib/services/aiServices.ts).
 */
export const AI_SERVICES_AI_RAG_PLATFORM_PAGE: CmsSeedPage = {
  key: 'ai-services-ai-rag-platform',
  path: '/ai-services/ai-rag-platform',
  kind: 'PAGE',
  title: 'AI RAG Platform | AI Services | Exyconn',
  layout: 'default',
  seo: {
    title: 'AI RAG Platform | AI Services | Exyconn',
    description: 'Retrieval that grounds answers in your own content, with citations.',
    keywords: 'AI RAG Platform, Platform & Infrastructure, AI services, Exyconn',
    ogImageUrl: '',
    canonical: 'https://exyconn.com/ai-services/ai-rag-platform',
    noindex: false,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'AI RAG Platform',
        description:
          'Retrieval-augmented generation done properly: ingestion and chunking suited to your documents, retrieval you can evaluate, and citations on every answer. Most disappointing AI features fail at retrieval, not at the model.',
        url: 'https://exyconn.com/ai-services/ai-rag-platform',
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
          name: 'AI RAG Platform deliverables',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Ingestion pipeline for your document formats',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Retrieval quality measured against a real question set',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Citations back to the source passage',
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: 'Permissions respected so answers never leak content',
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
            name: 'AI RAG Platform',
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
          label: 'AI RAG Platform',
          href: '',
        },
      ],
      title: 'AI RAG Platform',
      lede: 'Retrieval that grounds answers in your own content, with citations.',
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
        'Retrieval-augmented generation done properly: ingestion and chunking suited to your documents, retrieval you can evaluate, and citations on every answer. Most disappointing AI features fail at retrieval, not at the model.',
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
        'Ingestion pipeline for your document formats',
        'Retrieval quality measured against a real question set',
        'Citations back to the source passage',
        'Permissions respected so answers never leak content',
      ],
    }),
    place('aiservice.related', {
      index: 3,
      label: 'Related',
      title: 'More in Platform & Infrastructure',
      more: 'Explore service',
      services: [
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
