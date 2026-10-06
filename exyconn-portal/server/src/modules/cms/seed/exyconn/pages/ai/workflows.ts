import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/** exyconn.com/ai/workflows (formerly exyconn-website/src/pages/[market]/ai/workflows.astro). */
export const AI_WORKFLOWS_PAGE: CmsSeedPage = {
  key: 'ai-workflows',
  path: '/ai/workflows',
  kind: 'PAGE',
  title: 'AI Workflows for Modern Business | Exyconn',
  layout: 'default',
  seo: {
    title: 'AI Workflows for Modern Business | Exyconn',
    description:
      'Discover how AI-powered workflows can automate, optimize, and scale your business processes. Learn about use cases, benefits, and how Exyconn helps you achieve operational excellence with intelligent automation.',
    keywords:
      'AI workflows, business automation, process optimization, real-time analytics, seamless collaboration, Exyconn',
    ogImageUrl:
      'https://images.unsplash.com/photo-1521737711867-e3b97375f902?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1587&q=80',
    canonical: '',
    noindex: false,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://exyconn.com/{market}',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'AI',
            item: 'https://exyconn.com/{market}/ai',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'AI workflows',
            item: 'https://exyconn.com/{market}/ai/workflows',
          },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'AI workflows',
        description:
          'Discover how AI-powered workflows can automate, optimize, and scale your business processes. Learn about use cases, benefits, and how Exyconn helps you achieve operational excellence with intelligent automation.',
        url: 'https://exyconn.com/{market}/ai/workflows',
        serviceType: 'AI',
        provider: {
          '@type': 'Organization',
          name: 'Exyconn',
          url: 'https://exyconn.com',
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'How AI workflows transform your business',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'End-to-end automation',
              description:
                'Automate entire processes—from data collection to reporting—minimizing manual intervention and delays.',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Real-time analytics',
              description:
                'Gain instant insights and trigger actions based on live data, improving responsiveness and outcomes.',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Seamless collaboration',
              description:
                'Connect teams, departments, and systems for unified, efficient workflows and better communication.',
            },
          ],
        },
      },
    ],
  },
  html: [
    place('detail.stage', {
      family: 'ai',
      crumbs: [
        {
          label: 'Home',
          href: '/',
        },
        {
          label: 'AI',
          href: '/ai',
        },
        {
          label: 'AI workflows',
          href: '',
        },
      ],
      title: 'Automate, optimize and scale with AI workflows',
      lede: 'Unlock the power of AI-driven workflows to streamline, automate, and elevate your business processes. From data collection to actionable insights, our solutions help you achieve operational excellence and drive growth.',
      primary: {
        label: 'Contact us',
        href: '/contact',
      },
      secondary: {
        label: 'Browse AI services',
        href: '/ai-services',
      },
      scene: {
        shapes: ['pipeline'],
        data: {
          pipeline: {
            stations: 4,
            branchAt: 2,
          },
        },
      },
      glyph: '',
      tagline: 'Automate. Optimize. Scale.',
    }),
    place('detail.logos', {
      label: 'Our business tools',
      logos: [
        {
          name: 'Claude',
          src: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Claude_AI_logo.svg',
          width: 690,
          height: 148,
        },
        {
          name: 'OpenAI',
          src: '/logos/openai.svg',
          width: 512,
          height: 142,
        },
        {
          name: 'Gemini',
          src: '/logos/gemini.png',
          width: 3304,
          height: 1200,
        },
      ],
    }),
    place('detail.intro', {
      index: 1,
      label: 'What it is',
      intro: {
        title: 'What are AI workflows?',
        icon: 'diagram-project',
        term: 'AI Workflows',
        definition:
          'are orchestrated sequences of automated tasks, powered by artificial intelligence, that optimize and accelerate business operations. They connect data, people, and systems—enabling seamless automation, intelligent decision-making, and continuous improvement across your organization.',
      },
      benefits: {
        title: 'Why do AI workflows matter?',
        items: [
          {
            icon: 'bolt',
            text: 'Accelerate repetitive and manual processes with automation.',
          },
          {
            icon: 'brain',
            text: 'Enable smarter, data-driven decisions at every step.',
          },
          {
            icon: 'link',
            text: 'Integrate seamlessly with your existing tools and platforms.',
          },
          {
            icon: 'chart-line',
            text: 'Boost productivity, reduce errors, and lower operational costs.',
          },
          {
            icon: 'rocket',
            text: 'Scale effortlessly as your business grows and evolves.',
          },
        ],
      },
      demo: {
        kind: 'trace',
        title: 'workflow · live',
        caption:
          'An AI workflow from data collection to reporting, acting on live data on the way.',
        steps: [
          {
            label: 'Collect',
            detail: 'Data collection, automated',
          },
          {
            label: 'Analyze',
            detail: 'Instant insights from live data',
          },
          {
            label: 'Act',
            detail: 'Trigger actions based on live data',
          },
          {
            label: 'Report',
            detail: 'Reporting without manual intervention',
          },
        ],
      },
    }),
    place('detail.architecture', {
      index: 2,
      label: 'Architecture',
      title: 'What an AI workflow connects',
      layers: [
        {
          label: 'Inputs',
          nodes: ['Data', 'People', 'Systems'],
        },
        {
          label: 'Workflow',
          nodes: ['Collect', 'Analyze', 'Act', 'Report'],
        },
        {
          label: 'Integrations',
          nodes: ['Business tools', 'CRMs', 'ERPs', 'Cloud services'],
        },
      ],
    }),
    place('detail.offerings', {
      index: 3,
      label: 'Use cases',
      offerings: {
        title: 'How AI workflows transform your business',
        items: [
          {
            icon: 'robot',
            title: 'End-to-end automation',
            text: 'Automate entire processes—from data collection to reporting—minimizing manual intervention and delays.',
          },
          {
            icon: 'chart-pie',
            title: 'Real-time analytics',
            text: 'Gain instant insights and trigger actions based on live data, improving responsiveness and outcomes.',
          },
          {
            icon: 'people-arrows',
            title: 'Seamless collaboration',
            text: 'Connect teams, departments, and systems for unified, efficient workflows and better communication.',
          },
        ],
      },
    }),
    place('detail.faq', {
      index: 4,
      label: 'FAQ',
      title: 'Questions about AI workflows',
      items: [
        {
          question: 'What is the difference between a workflow and a process?',
          answer:
            'A workflow is a defined sequence of tasks (often automated) to achieve a specific outcome, while a process is a broader set of activities that may include multiple workflows.',
        },
        {
          question: 'Can AI workflows integrate with my existing software?',
          answer:
            'Yes, modern AI workflow platforms are designed to integrate with popular business tools, CRMs, ERPs, and cloud services.',
        },
        {
          question: 'How do I measure the ROI of AI workflows?',
          answer:
            'Track KPIs such as time saved, error reduction, cost savings, and business outcomes before and after implementation.',
        },
      ],
    }),
    place('detail.related', {
      index: 5,
      label: 'More AI capabilities',
      title: 'Keep exploring AI',
      more: 'Explore',
      cards: [
        {
          href: '/ai/bot-creation',
          index: 'AI/07',
          title: 'AI bot creation',
          text: 'Build custom AI bots for chat, support, automation, and business workflows with Exyconn.',
          tags: ['Conversational bots', 'Workflow bots', 'Support bots'],
        },
        {
          href: '/ai/agentic',
          index: 'AI/01',
          title: 'Agentic AI',
          text: 'Discover Agentic AI solutions by Exyconn.',
          tags: ['Process automation', 'Adaptive decision-making', 'Collaboration & integration'],
        },
        {
          href: '/ai/llms',
          index: 'AI/02',
          title: 'Large language models',
          text: 'Unlock the power of Large Language Models (LLMs) for your business.',
          tags: ['Conversational AI', 'Content automation', 'Knowledge & search'],
        },
      ],
    }),
    place('detail.cta', {
      family: 'ai',
      label: 'Next step',
      title: 'Start with AI workflows',
      text: 'Automate. Optimize. Scale.',
      primary: {
        label: 'Contact us',
        href: '/contact',
      },
      secondary: {
        label: 'Get a quote',
        href: '/get-a-quote',
      },
      echoShape: 0,
    }),
  ].join(''),
  css: '',
};
