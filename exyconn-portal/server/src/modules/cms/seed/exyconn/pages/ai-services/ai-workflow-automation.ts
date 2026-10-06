import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/**
 * exyconn.com/ai-services/ai-workflow-automation (formerly the [slug].astro template
 * of exyconn-website/src/pages/[market]/ai-services over lib/services/aiServices.ts).
 */
export const AI_SERVICES_AI_WORKFLOW_AUTOMATION_PAGE: CmsSeedPage = {
  key: 'ai-services-ai-workflow-automation',
  path: '/ai-services/ai-workflow-automation',
  kind: 'PAGE',
  title: 'AI Workflow Automation | AI Services | Exyconn',
  layout: 'default',
  seo: {
    title: 'AI Workflow Automation | AI Services | Exyconn',
    description:
      'End-to-end processes automated across the systems that already run your business.',
    keywords: 'AI Workflow Automation, Agents & Automation, AI services, Exyconn',
    ogImageUrl: '',
    canonical: 'https://exyconn.com/ai-services/ai-workflow-automation',
    noindex: false,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'AI Workflow Automation',
        description:
          'Rule-based automation breaks on anything unstructured — an email that phrases things differently, an invoice in a new layout. We combine deterministic steps with AI for the judgement calls, so a whole workflow completes instead of stopping at the first exception.',
        url: 'https://exyconn.com/ai-services/ai-workflow-automation',
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
          name: 'AI Workflow Automation deliverables',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'A mapped process with the manual handoffs identified',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Automation across systems, not inside a single tool',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Exceptions routed to a person instead of failing silently',
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: 'Run history you can audit when something looks wrong',
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
            name: 'AI Workflow Automation',
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
          label: 'AI Workflow Automation',
          href: '',
        },
      ],
      title: 'AI Workflow Automation',
      lede: 'End-to-end processes automated across the systems that already run your business.',
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
        'Rule-based automation breaks on anything unstructured — an email that phrases things differently, an invoice in a new layout. We combine deterministic steps with AI for the judgement calls, so a whole workflow completes instead of stopping at the first exception.',
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
        'A mapped process with the manual handoffs identified',
        'Automation across systems, not inside a single tool',
        'Exceptions routed to a person instead of failing silently',
        'Run history you can audit when something looks wrong',
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
