import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/**
 * exyconn.com/ai-services/ai-agents-for-smbs (formerly the [slug].astro template
 * of exyconn-website/src/pages/[market]/ai-services over lib/services/aiServices.ts).
 */
export const AI_SERVICES_AI_AGENTS_FOR_SMBS_PAGE: CmsSeedPage = {
  key: 'ai-services-ai-agents-for-smbs',
  path: '/ai-services/ai-agents-for-smbs',
  kind: 'PAGE',
  title: 'AI Agents for SMBs | AI Services | Exyconn',
  layout: 'default',
  seo: {
    title: 'AI Agents for SMBs | AI Services | Exyconn',
    description: 'Production AI agents sized and priced for small and mid-sized businesses.',
    keywords: 'AI Agents for SMBs, Agents & Automation, AI services, Exyconn',
    ogImageUrl: '',
    canonical: 'https://exyconn.com/ai-services/ai-agents-for-smbs',
    noindex: false,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'AI Agents for SMBs',
        description:
          'Most AI agent projects are scoped for enterprises with a team to run them. We build agents a small business can actually operate: connected to the tools you already use, with clear limits on what they may do on their own. You get a working agent handling a real task, not a pilot that stalls after the demo.',
        url: 'https://exyconn.com/ai-services/ai-agents-for-smbs',
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
          name: 'AI Agents for SMBs deliverables',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'An agent live on one high-volume task within weeks',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Connected to your existing CRM, inbox and spreadsheets',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Explicit approval steps wherever money or customers are involved',
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: 'Handover documentation so your team can adjust it without us',
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
            name: 'AI Agents for SMBs',
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
          label: 'AI Agents for SMBs',
          href: '',
        },
      ],
      title: 'AI Agents for SMBs',
      lede: 'Production AI agents sized and priced for small and mid-sized businesses.',
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
        'Most AI agent projects are scoped for enterprises with a team to run them. We build agents a small business can actually operate: connected to the tools you already use, with clear limits on what they may do on their own. You get a working agent handling a real task, not a pilot that stalls after the demo.',
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
        'An agent live on one high-volume task within weeks',
        'Connected to your existing CRM, inbox and spreadsheets',
        'Explicit approval steps wherever money or customers are involved',
        'Handover documentation so your team can adjust it without us',
      ],
    }),
    place('aiservice.related', {
      index: 3,
      label: 'Related',
      title: 'More in Agents & Automation',
      more: 'Explore service',
      services: [
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
        {
          href: '/ai-services/ai-whatsapp-automation',
          title: 'AI WhatsApp Automation',
          text: 'Sales and support on WhatsApp, automated on the official Business API.',
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
