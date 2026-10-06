import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/**
 * exyconn.com/ai-services/ai-whatsapp-automation (formerly the [slug].astro template
 * of exyconn-website/src/pages/[market]/ai-services over lib/services/aiServices.ts).
 */
export const AI_SERVICES_AI_WHATSAPP_AUTOMATION_PAGE: CmsSeedPage = {
  key: 'ai-services-ai-whatsapp-automation',
  path: '/ai-services/ai-whatsapp-automation',
  kind: 'PAGE',
  title: 'AI WhatsApp Automation | AI Services | Exyconn',
  layout: 'default',
  seo: {
    title: 'AI WhatsApp Automation | AI Services | Exyconn',
    description: 'Sales and support on WhatsApp, automated on the official Business API.',
    keywords: 'AI WhatsApp Automation, Agents & Automation, AI services, Exyconn',
    ogImageUrl: '',
    canonical: 'https://exyconn.com/ai-services/ai-whatsapp-automation',
    noindex: false,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'AI WhatsApp Automation',
        description:
          'For a large share of customers WhatsApp is the primary channel. We build automations on the official Business API — template approval, opt-in handling and all — that answer questions, take orders and chase payments without putting your number at risk.',
        url: 'https://exyconn.com/ai-services/ai-whatsapp-automation',
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
          name: 'AI WhatsApp Automation deliverables',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Official Business API setup with approved templates',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Automated replies, order updates and payment reminders',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Escalation to a human agent inside the same thread',
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: 'Conversations logged against the customer record',
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
            name: 'AI WhatsApp Automation',
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
          label: 'AI WhatsApp Automation',
          href: '',
        },
      ],
      title: 'AI WhatsApp Automation',
      lede: 'Sales and support on WhatsApp, automated on the official Business API.',
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
        'For a large share of customers WhatsApp is the primary channel. We build automations on the official Business API — template approval, opt-in handling and all — that answer questions, take orders and chase payments without putting your number at risk.',
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
        'Official Business API setup with approved templates',
        'Automated replies, order updates and payment reminders',
        'Escalation to a human agent inside the same thread',
        'Conversations logged against the customer record',
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
