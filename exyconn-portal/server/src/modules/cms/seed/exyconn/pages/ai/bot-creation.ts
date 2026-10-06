import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/** exyconn.com/ai/bot-creation (formerly exyconn-website/src/pages/[market]/ai/bot-creation.astro). */
export const AI_BOT_CREATION_PAGE: CmsSeedPage = {
  key: 'ai-bot-creation',
  path: '/ai/bot-creation',
  kind: 'PAGE',
  title: 'AI Bot Creation | Conversational Bots | Exyconn',
  layout: 'default',
  seo: {
    title: 'AI Bot Creation | Conversational Bots | Exyconn',
    description:
      'Build custom AI bots for chat, support, automation, and business workflows with Exyconn. Deploy conversational, task, and workflow bots tailored to your needs.',
    keywords: 'AI bot creation, chatbots, workflow bots, conversational AI, automation, Exyconn',
    ogImageUrl:
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
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
            name: 'AI bot creation',
            item: 'https://exyconn.com/{market}/ai/bot-creation',
          },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'AI bot creation',
        description:
          'Build custom AI bots for chat, support, automation, and business workflows with Exyconn. Deploy conversational, task, and workflow bots tailored to your needs.',
        url: 'https://exyconn.com/{market}/ai/bot-creation',
        serviceType: 'AI',
        provider: {
          '@type': 'Organization',
          name: 'Exyconn',
          url: 'https://exyconn.com',
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Types of bots we build',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Conversational bots',
              description: 'Engage users in natural language via chat, web, or messaging apps.',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Workflow bots',
              description: 'Automate multi-step business processes and approvals.',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Support bots',
              description: 'Provide instant answers, ticketing, and escalation for support teams.',
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
          label: 'AI bot creation',
          href: '',
        },
      ],
      title: 'Custom AI bots that engage and automate',
      lede: 'Accelerate your business with custom AI bots for chat, support, and workflow automation. Exyconn designs and deploys bots that engage users, automate tasks, and streamline operations across channels.',
      primary: {
        label: 'Start your bot project',
        href: '/contact',
      },
      secondary: {
        label: 'Browse AI services',
        href: '/ai-services',
      },
      scene: {
        shapes: ['glyph'],
      },
      glyph: 'chatBubbles',
      tagline: 'Conversational. Automated. Effective.',
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
        title: 'What is AI bot creation?',
        icon: 'robot',
        term: 'AI Bot Creation',
        definition:
          'is the process of designing, building, and deploying intelligent bots that can converse, automate tasks, and handle workflows across chat, web, and business platforms. These bots use AI to understand, respond, and act on user input or business triggers.',
      },
      benefits: {
        title: 'Why invest in AI bots?',
        items: [
          {
            icon: 'comments',
            text: '24/7 conversational support for customers and employees.',
          },
          {
            icon: 'bolt',
            text: 'Automates repetitive tasks and business workflows.',
          },
          {
            icon: 'layer-group',
            text: 'Integrates with your apps, CRMs, and APIs.',
          },
          {
            icon: 'chart-line',
            text: 'Improves efficiency and reduces operational costs.',
          },
          {
            icon: 'user-check',
            text: 'Delivers consistent, accurate responses every time.',
          },
        ],
      },
      demo: {
        kind: 'chat',
        title: 'bot · web chat',
        caption:
          'A visitor asks the bot which platforms it can be deployed on and gets an instant answer.',
        messages: [
          {
            from: 'user',
            text: 'What platforms can Exyconn deploy bots on?',
          },
          {
            from: 'agent',
            text: 'We build bots for web, chat (WhatsApp, Slack, Teams), mobile apps, and integrate with CRMs, ERPs, and custom APIs.',
          },
        ],
      },
    }),
    place('detail.architecture', {
      index: 2,
      label: 'Architecture',
      title: 'How an Exyconn bot is put together',
      layers: [
        {
          label: 'Channels',
          nodes: ['Web', 'Chat apps', 'Mobile apps'],
        },
        {
          label: 'Bots',
          nodes: ['Conversational', 'Workflow', 'Support'],
        },
        {
          label: 'Understanding',
          nodes: ['NLP', 'AI models'],
        },
        {
          label: 'Your systems',
          nodes: ['CRMs', 'ERPs', 'Custom APIs'],
        },
      ],
    }),
    place('detail.offerings', {
      index: 3,
      label: 'Use cases',
      offerings: {
        title: 'Types of bots we build',
        items: [
          {
            icon: 'comments',
            title: 'Conversational bots',
            text: 'Engage users in natural language via chat, web, or messaging apps.',
          },
          {
            icon: 'diagram-project',
            title: 'Workflow bots',
            text: 'Automate multi-step business processes and approvals.',
          },
          {
            icon: 'headset',
            title: 'Support bots',
            text: 'Provide instant answers, ticketing, and escalation for support teams.',
          },
        ],
      },
    }),
    place('detail.faq', {
      index: 4,
      label: 'FAQ',
      title: 'Questions about AI bot creation',
      items: [
        {
          question: 'What platforms can Exyconn deploy bots on?',
          answer:
            'We build bots for web, chat (WhatsApp, Slack, Teams), mobile apps, and integrate with CRMs, ERPs, and custom APIs.',
        },
        {
          question: 'Can bots handle complex workflows?',
          answer:
            'Yes, our bots can automate multi-step workflows, approvals, and integrate with your business logic.',
        },
        {
          question: 'How do bots understand user input?',
          answer:
            'We use advanced NLP and AI models to interpret, classify, and respond to user queries in natural language.',
        },
        {
          question: 'Are bots secure and compliant?',
          answer:
            'Yes, we follow best practices for data privacy, security, and compliance in all bot deployments.',
        },
        {
          question: 'How do I get started with AI bot creation?',
          answer:
            'Contact Exyconn for a free consultation. We’ll assess your needs, use cases, and recommend the best bot solution for your business.',
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
        {
          href: '/ai/models',
          index: 'AI/03',
          title: 'Ready-to-use AI models',
          text: "Explore Exyconn's library of ready-to-use AI models for NLP, vision, analytics, and automation.",
          tags: ['NLP & text', 'Vision & image', 'Analytics & automation'],
        },
      ],
    }),
    place('detail.cta', {
      family: 'ai',
      label: 'Next step',
      title: 'Start with AI bot creation',
      text: 'Conversational. Automated. Effective.',
      primary: {
        label: 'Start your bot project',
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
