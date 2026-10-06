import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/**
 * exyconn.com/ai-services/ai-document-processing (formerly the [slug].astro template
 * of exyconn-website/src/pages/[market]/ai-services over lib/services/aiServices.ts).
 */
export const AI_SERVICES_AI_DOCUMENT_PROCESSING_PAGE: CmsSeedPage = {
  key: 'ai-services-ai-document-processing',
  path: '/ai-services/ai-document-processing',
  kind: 'PAGE',
  title: 'AI Document Processing | AI Services | Exyconn',
  layout: 'default',
  seo: {
    title: 'AI Document Processing | AI Services | Exyconn',
    description: 'Invoices, contracts and forms turned into structured data you can trust.',
    keywords: 'AI Document Processing, Agents & Automation, AI services, Exyconn',
    ogImageUrl: '',
    canonical: 'https://exyconn.com/ai-services/ai-document-processing',
    noindex: false,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'AI Document Processing',
        description:
          'Extraction from documents that vary in layout, quality and language — scanned invoices, signed contracts, handwritten forms. Every field carries a confidence score, and anything below your threshold goes to a reviewer rather than quietly entering your system wrong.',
        url: 'https://exyconn.com/ai-services/ai-document-processing',
        serviceType: 'Agents & Automation',
        category: 'Agents & Automation',
        areaServed: 'Worldwide',
        provider: {
          '@type': 'Organization',
          name: 'Exyconn',
          url: 'https://exyconn.com',
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'AI Document Processing deliverables',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Structured output from PDFs, scans and photos',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Confidence scores with a human review queue',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Validation against your existing records',
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: 'Straight into your ERP or accounting system',
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
            name: 'Agents & Automation',
            item: 'https://exyconn.com/ai-services?cat=agents-automation',
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: 'AI Document Processing',
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
          label: 'Agents & Automation',
          href: '/ai-services?cat=agents-automation',
        },
        {
          label: 'AI Document Processing',
          href: '',
        },
      ],
      title: 'AI Document Processing',
      lede: 'Invoices, contracts and forms turned into structured data you can trust.',
      primary: {
        label: 'Get a quote',
        href: '/get-a-quote',
      },
      secondary: {
        label: 'Talk to us',
        href: '/contact',
      },
      scene: {
        shapes: ['neuralCore'],
        data: {
          neuralCore: {
            modules: 6,
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
        'Extraction from documents that vary in layout, quality and language — scanned invoices, signed contracts, handwritten forms. Every field carries a confidence score, and anything below your threshold goes to a reviewer rather than quietly entering your system wrong.',
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
        title: 'Agents & Automation',
        description:
          'Agents that carry out real work across your tools, not chatbots that only answer questions.',
        href: '/ai-services?cat=agents-automation',
        link: 'See the whole category',
      },
    }),
    place('aiservice.outcomes', {
      index: 2,
      label: 'Deliverables',
      title: 'What you get',
      outcomes: [
        'Structured output from PDFs, scans and photos',
        'Confidence scores with a human review queue',
        'Validation against your existing records',
        'Straight into your ERP or accounting system',
      ],
    }),
    place('aiservice.related', {
      index: 3,
      label: 'Related',
      title: 'More in Agents & Automation',
      more: 'Explore service',
      services: [
        {
          href: '/ai-services/ai-agents-for-smbs',
          title: 'AI Agents for SMBs',
          text: 'Production AI agents sized and priced for small and mid-sized businesses.',
        },
        {
          href: '/ai-services/ai-workflow-automation',
          title: 'AI Workflow Automation',
          text: 'End-to-end processes automated across the systems that already run your business.',
        },
        {
          href: '/ai-services/ai-voice-agents',
          title: 'AI Voice Agents',
          text: 'Voice agents that book, qualify and answer on live calls.',
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
