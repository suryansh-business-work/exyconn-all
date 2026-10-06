import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/** exyconn.com/ai (formerly exyconn-website/src/pages/[market]/ai/index.astro). */
export const AI_HUB_PAGE: CmsSeedPage = {
  key: 'ai',
  path: '/ai',
  kind: 'PAGE',
  title: 'AI Platform | Agentic AI, LLMs & Automation | Exyconn',
  layout: 'default',
  seo: {
    title: 'AI Platform | Agentic AI, LLMs & Automation | Exyconn',
    description:
      "Deploy production-ready AI solutions with Exyconn's AI Platform. Agentic AI agents, custom LLM training, workflow automation, and MCP server infrastructure for enterprise scale.",
    keywords:
      'AI platform, agentic AI, LLM training, AI automation, workflow AI, MCP server, enterprise AI, Exyconn',
    ogImageUrl:
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
    canonical: '',
    noindex: false,
    jsonLd: {
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
          name: 'AI',
        },
      ],
    },
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
          href: '',
        },
      ],
      title: 'AI that works from day one',
      lede: 'Deploy autonomous agents, train custom models and orchestrate intelligent workflows — production-ready and enterprise-secure.',
      primary: {
        label: 'Deploy your first agent',
        href: '/contact',
      },
      secondary: {
        label: 'Order pre-built agents',
        href: '/order-agents',
      },
      scene: {
        shapes: ['core'],
      },
      glyph: '',
      tagline: '',
    }),
    place('detail.proof', {
      label: 'AI platform at a glance',
      items: [
        {
          value: '10x',
          label: 'Faster deployment',
        },
        {
          value: '95%',
          label: 'Accuracy rate',
        },
        {
          value: '50+',
          label: 'Pre-built agents',
        },
        {
          value: '50+',
          label: 'Integrations',
        },
      ],
    }),
    place('service.grouped-cards', {
      index: 1,
      id: 'capabilities',
      label: 'Capability map',
      title: 'Build, model, connect',
      lede: 'Everything you need to build, deploy and scale intelligent AI systems.',
      more: 'Learn more',
      highlight: false,
      groups: [
        {
          id: 'build',
          label: 'Build',
          title: 'Agents and automation',
          text: '',
          cards: [
            {
              href: '/ai/agentic',
              title: 'Agentic AI',
              text: 'Autonomous agents that perceive, decide and act to achieve business goals, around the clock.',
              index: '',
              tags: [],
            },
            {
              href: '/ai/bot-creation',
              title: 'Bot creation',
              text: 'Conversational and workflow bots for customer support, lead qualification and task automation.',
              index: '',
              tags: [],
            },
            {
              href: '/ai/workflows',
              title: 'AI workflows',
              text: 'Automate complex multi-step business processes with intelligent, adaptive workflows.',
              index: '',
              tags: [],
            },
          ],
        },
        {
          id: 'models',
          label: 'Models',
          title: 'Language and custom models',
          text: '',
          cards: [
            {
              href: '/ai/llms',
              title: 'LLM solutions',
              text: 'Large language models for text generation, analysis, translation and knowledge retrieval.',
              index: '',
              tags: [],
            },
            {
              href: '/ai/models',
              title: 'Ready-to-use models',
              text: 'Proven models for NLP, vision, analytics and automation — chat, classification, extraction.',
              index: '',
              tags: [],
            },
            {
              href: '/ai/custom-model-training',
              title: 'Custom training',
              text: 'Train and fine-tune models on your proprietary data for domain-specific accuracy.',
              index: '',
              tags: [],
            },
          ],
        },
        {
          id: 'connect',
          label: 'Connect',
          title: 'Context and infrastructure',
          text: '',
          cards: [
            {
              href: '/ai/mcp-server',
              title: 'MCP server',
              text: 'Deploy and manage AI pipelines on our Model Context Protocol infrastructure at enterprise scale.',
              index: '',
              tags: [],
            },
          ],
        },
      ],
    }),
    place('ai.governance', {
      index: 2,
      id: 'governance',
      label: 'Governance',
      title: 'Built different, deployed safely',
      promises: [
        {
          title: '10x faster',
          text: 'Pre-built components mean you ship in weeks, not months.',
        },
        {
          title: 'Enterprise secure',
          text: 'SOC 2 compliant with end-to-end encryption and audit logs.',
        },
        {
          title: 'Infinite scale',
          text: 'Auto-scaling infrastructure handles any workload seamlessly.',
        },
        {
          title: '50+ integrations',
          text: 'Connect with your existing tools and data sources instantly.',
        },
      ],
      category: 'Trust & Security',
      servicesTitle: 'Keeping AI defensible',
      description:
        'Keeping AI systems defensible — controlled, monitored and safe to put in front of customers.',
      services: [
        {
          title: 'AI Cybersecurity',
          href: '/ai-services/ai-cybersecurity',
        },
        {
          title: 'AI Governance & Guardrails',
          href: '/ai-services/ai-governance-guardrails',
        },
      ],
      more: {
        label: 'See trust & security services',
        href: '/ai-services?cat=trust-security',
      },
    }),
    place('service.related-hubs', {
      index: 3,
      label: 'Explore',
      title: 'Agents ready to order, and the full catalogue',
      links: [
        {
          href: '/services',
          title: 'Services hub',
          text: 'Every service by pillar — build, modernise and grow.',
          more: 'Browse services',
        },
        {
          href: '/our-services',
          title: 'Our service pillars',
          text: 'AI platform services, SaaS development and enterprise consulting.',
          more: 'See the pillars',
        },
        {
          href: '/exyconn-services',
          title: 'Infrastructure platform',
          text: 'Email, payments, logs, themes, translations and more — all in one place.',
          more: 'See the platform',
        },
        {
          href: '/ai-services',
          title: 'AI services catalogue',
          text: 'Every AI product and build service we offer, by capability area.',
          more: 'Open the catalogue',
        },
      ],
      featured: {
        href: '/order-agents',
        title: 'Order pre-built agents',
        text: 'Pick from 50+ pre-built agents and have one working in your stack within days.',
        more: 'Order agents',
      },
    }),
    place('detail.cta', {
      family: 'ai',
      label: '',
      title: 'Ready to deploy AI?',
      text: 'Get your first AI agent running in production within days — not months.',
      primary: {
        label: 'Get a quote',
        href: '/get-a-quote',
      },
      secondary: {
        label: 'Talk to an expert',
        href: '/contact',
      },
      echoShape: 0,
    }),
  ].join(''),
  css: '',
};
