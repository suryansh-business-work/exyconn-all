import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/**
 * exyconn.com/ai-services/ai-personal-assistant (formerly the [slug].astro template
 * of exyconn-website/src/pages/[market]/ai-services over lib/services/aiServices.ts).
 */
export const AI_SERVICES_AI_PERSONAL_ASSISTANT_PAGE: CmsSeedPage = {
  key: 'ai-services-ai-personal-assistant',
  path: '/ai-services/ai-personal-assistant',
  kind: 'PAGE',
  title: 'AI Personal Assistant | AI Services | Exyconn',
  layout: 'default',
  seo: {
    title: 'AI Personal Assistant | AI Services | Exyconn',
    description: 'An assistant across inbox, calendar and notes that knows your business context.',
    keywords: 'AI Personal Assistant, Agents & Automation, AI services, Exyconn',
    ogImageUrl: '',
    canonical: 'https://exyconn.com/ai-services/ai-personal-assistant',
    noindex: false,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'AI Personal Assistant',
        description:
          'A private assistant for you or your leadership team: drafting replies in your voice, preparing you for meetings, keeping track of commitments made in conversation. It works from your own data and stays inside your own tenancy.',
        url: 'https://exyconn.com/ai-services/ai-personal-assistant',
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
          name: 'AI Personal Assistant deliverables',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Inbox triage with drafts ready in your tone',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Meeting briefs assembled from prior threads and notes',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Commitments and follow-ups tracked automatically',
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: 'Runs in your tenancy, not a shared third-party account',
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
            name: 'AI Personal Assistant',
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
          label: 'AI Personal Assistant',
          href: '',
        },
      ],
      title: 'AI Personal Assistant',
      lede: 'An assistant across inbox, calendar and notes that knows your business context.',
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
        'A private assistant for you or your leadership team: drafting replies in your voice, preparing you for meetings, keeping track of commitments made in conversation. It works from your own data and stays inside your own tenancy.',
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
        'Inbox triage with drafts ready in your tone',
        'Meeting briefs assembled from prior threads and notes',
        'Commitments and follow-ups tracked automatically',
        'Runs in your tenancy, not a shared third-party account',
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
