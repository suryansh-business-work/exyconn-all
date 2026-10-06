import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/** exyconn.com/ai/mcp-server (formerly exyconn-website/src/pages/[market]/ai/mcp-server.astro). */
export const AI_MCP_SERVER_PAGE: CmsSeedPage = {
  key: 'ai-mcp-server',
  path: '/ai/mcp-server',
  kind: 'PAGE',
  title: 'MCP Server | Model Context Protocol | Exyconn',
  layout: 'default',
  seo: {
    title: 'MCP Server | Model Context Protocol | Exyconn',
    description:
      "Explore Exyconn's MCP Server: a Model Context Protocol platform for orchestrating AI agents, managing multi-channel workflows, and automating business processes with context-aware intelligence.",
    keywords:
      'MCP server, Model Context Protocol, AI orchestration, workflow automation, context-aware AI, Exyconn',
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
            name: 'MCP server',
            item: 'https://exyconn.com/{market}/ai/mcp-server',
          },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'MCP server',
        description:
          "Explore Exyconn's MCP Server: a Model Context Protocol platform for orchestrating AI agents, managing multi-channel workflows, and automating business processes with context-aware intelligence.",
        url: 'https://exyconn.com/{market}/ai/mcp-server',
        serviceType: 'AI',
        provider: {
          '@type': 'Organization',
          name: 'Exyconn',
          url: 'https://exyconn.com',
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'How MCP server helps your business',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Context-aware orchestration',
              description:
                'Keeps track of user, process, and data context across all steps and agents.',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'AI agent management',
              description:
                'Deploy, coordinate, and monitor multiple AI models and agents in real time.',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Seamless integration',
              description:
                'Connects with your existing tools, APIs, and cloud services for unified automation.',
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
          label: 'MCP server',
          href: '',
        },
      ],
      title: 'Context-aware orchestration for AI agents',
      lede: "Leverage Exyconn's MCP Server to orchestrate AI agents and automate business processes using Model Context Protocol. Achieve seamless, context-aware automation across channels and systems.",
      primary: {
        label: 'Request a demo',
        href: '/contact',
      },
      secondary: {
        label: 'Browse AI services',
        href: '/ai-services',
      },
      scene: {
        shapes: ['hubSpokes'],
        data: {
          hubSpokes: {
            ports: 6,
          },
        },
      },
      glyph: '',
      tagline: 'Context. Orchestrate. Automate.',
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
        title: 'What is MCP server?',
        icon: 'server',
        term: 'MCP Server',
        definition:
          '(Model Context Protocol Server) is a platform that manages and orchestrates AI agents and business workflows using context-aware protocols. It enables dynamic, multi-step automation by maintaining context across models, channels, and user interactions.',
      },
      benefits: {
        title: 'Why use Model Context Protocol?',
        items: [
          {
            icon: 'network-wired',
            text: 'Maintains context across multi-step, multi-agent workflows.',
          },
          {
            icon: 'robot',
            text: 'Orchestrates AI agents and models for complex business logic.',
          },
          {
            icon: 'plug',
            text: 'Integrates with APIs, databases, and third-party systems.',
          },
          {
            icon: 'chart-line',
            text: 'Enables real-time monitoring and optimization of process flows.',
          },
          {
            icon: 'shield-halved',
            text: 'Ensures secure, auditable, and compliant automation.',
          },
        ],
      },
      demo: {
        kind: 'trace',
        title: 'mcp-server · run',
        caption:
          'One MCP Server run: context kept, agents coordinated, systems connected and every step logged.',
        steps: [
          {
            label: 'Keep context',
            detail: 'User, process and data context across all steps and agents',
          },
          {
            label: 'Coordinate',
            detail: 'Multiple AI agents and models, passing context and data between them',
          },
          {
            label: 'Connect',
            detail: 'CRMs, ERPs, databases and cloud services',
          },
          {
            label: 'Audit',
            detail: 'Access controls and audit logs',
          },
        ],
      },
    }),
    place('detail.architecture', {
      index: 2,
      label: 'Architecture',
      title: 'Model Context Protocol, layer by layer',
      layers: [
        {
          label: 'Context',
          nodes: ['User', 'Process', 'Data'],
        },
        {
          label: 'Orchestration',
          nodes: ['MCP Server'],
        },
        {
          label: 'Agents & models',
          nodes: ['AI agents', 'AI models'],
        },
        {
          label: 'Connections',
          nodes: ['APIs', 'Databases', 'CRMs', 'ERPs', 'Cloud services', 'Third-party tools'],
        },
      ],
    }),
    place('detail.offerings', {
      index: 3,
      label: 'Use cases',
      offerings: {
        title: 'How MCP server helps your business',
        items: [
          {
            icon: 'diagram-project',
            title: 'Context-aware orchestration',
            text: 'Keeps track of user, process, and data context across all steps and agents.',
          },
          {
            icon: 'bolt',
            title: 'AI agent management',
            text: 'Deploy, coordinate, and monitor multiple AI models and agents in real time.',
          },
          {
            icon: 'plug-circle-check',
            title: 'Seamless integration',
            text: 'Connects with your existing tools, APIs, and cloud services for unified automation.',
          },
        ],
      },
    }),
    place('detail.faq', {
      index: 4,
      label: 'FAQ',
      title: 'Questions about MCP server',
      items: [
        {
          question: 'What is the Model Context Protocol (MCP)?',
          answer:
            'MCP is a protocol for managing and maintaining context across AI models, agents, and workflows, enabling seamless automation and intelligent orchestration.',
        },
        {
          question: 'How does MCP Server orchestrate AI agents?',
          answer:
            'MCP Server coordinates multiple AI agents and models, passing context and data between them to automate complex business processes.',
        },
        {
          question: 'Can MCP Server integrate with my existing systems?',
          answer:
            'Yes, MCP Server provides APIs and connectors for integration with CRMs, ERPs, databases, and cloud services.',
        },
        {
          question: 'Is MCP Server secure and compliant?',
          answer:
            'Yes, it includes robust security, access controls, and audit logs to help meet compliance requirements.',
        },
        {
          question: 'How do I get started with MCP Server?',
          answer:
            'Begin by mapping your business processes, identifying integration points, and working with Exyconn to design and deploy your MCP Server solution.',
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
          href: '/ai/workflows',
          index: 'AI/06',
          title: 'AI workflows',
          text: 'Discover how AI-powered workflows can automate, optimize, and scale your business processes.',
          tags: ['End-to-end automation', 'Real-time analytics', 'Seamless collaboration'],
        },
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
      ],
    }),
    place('detail.cta', {
      family: 'ai',
      label: 'Next step',
      title: 'Start with MCP server',
      text: 'Context. Orchestrate. Automate.',
      primary: {
        label: 'Request a demo',
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
