import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/**
 * exyconn.com/ai-services/ai-voice-agents (formerly the [slug].astro template
 * of exyconn-website/src/pages/[market]/ai-services over lib/services/aiServices.ts).
 */
export const AI_SERVICES_AI_VOICE_AGENTS_PAGE: CmsSeedPage = {
  key: 'ai-services-ai-voice-agents',
  path: '/ai-services/ai-voice-agents',
  kind: 'PAGE',
  title: 'AI Voice Agents | AI Services | Exyconn',
  layout: 'default',
  seo: {
    title: 'AI Voice Agents | AI Services | Exyconn',
    description: 'Voice agents that book, qualify and answer on live calls.',
    keywords: 'AI Voice Agents, Agents & Automation, AI services, Exyconn',
    ogImageUrl: '',
    canonical: 'https://exyconn.com/ai-services/ai-voice-agents',
    noindex: false,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'AI Voice Agents',
        description:
          'Voice agents that hold a real conversation, handle interruptions and pass to a human the moment they should. We tune them on your actual call recordings, so they use your language and know the questions your customers really ask.',
        url: 'https://exyconn.com/ai-services/ai-voice-agents',
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
          name: 'AI Voice Agents deliverables',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Inbound calls answered around the clock',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Outbound qualification and appointment booking',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Clean handover to a human with the context attached',
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: 'Transcripts and outcomes written back to your CRM',
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
            name: 'AI Voice Agents',
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
          label: 'AI Voice Agents',
          href: '',
        },
      ],
      title: 'AI Voice Agents',
      lede: 'Voice agents that book, qualify and answer on live calls.',
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
        'Voice agents that hold a real conversation, handle interruptions and pass to a human the moment they should. We tune them on your actual call recordings, so they use your language and know the questions your customers really ask.',
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
        'Inbound calls answered around the clock',
        'Outbound qualification and appointment booking',
        'Clean handover to a human with the context attached',
        'Transcripts and outcomes written back to your CRM',
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
