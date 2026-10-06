import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/**
 * exyconn.com/ai-services/ai-knowledge-management (formerly the [slug].astro template
 * of exyconn-website/src/pages/[market]/ai-services over lib/services/aiServices.ts).
 */
export const AI_SERVICES_AI_KNOWLEDGE_MANAGEMENT_PAGE: CmsSeedPage = {
  key: 'ai-services-ai-knowledge-management',
  path: '/ai-services/ai-knowledge-management',
  kind: 'PAGE',
  title: 'AI Knowledge Management | AI Services | Exyconn',
  layout: 'default',
  seo: {
    title: 'AI Knowledge Management | AI Services | Exyconn',
    description: 'Scattered institutional knowledge made searchable and kept current.',
    keywords: 'AI Knowledge Management, Platform & Infrastructure, AI services, Exyconn',
    ogImageUrl: '',
    canonical: 'https://exyconn.com/ai-services/ai-knowledge-management',
    noindex: false,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'AI Knowledge Management',
        description:
          'Knowledge spread across wikis, drives, tickets and chat threads, unified into something answerable. Includes the harder half: spotting what has gone stale or contradicts itself, so the corpus does not rot.',
        url: 'https://exyconn.com/ai-services/ai-knowledge-management',
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
          name: 'AI Knowledge Management deliverables',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'One answerable surface across your systems',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Stale and conflicting content surfaced',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Access controls respected in every answer',
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: 'Usage data showing what people cannot find',
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
            name: 'AI Knowledge Management',
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
          label: 'AI Knowledge Management',
          href: '',
        },
      ],
      title: 'AI Knowledge Management',
      lede: 'Scattered institutional knowledge made searchable and kept current.',
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
        'Knowledge spread across wikis, drives, tickets and chat threads, unified into something answerable. Includes the harder half: spotting what has gone stale or contradicts itself, so the corpus does not rot.',
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
        'One answerable surface across your systems',
        'Stale and conflicting content surfaced',
        'Access controls respected in every answer',
        'Usage data showing what people cannot find',
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
